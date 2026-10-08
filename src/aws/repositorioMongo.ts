import { Schema, type Connection } from "mongoose";
import type { Criacao, RepositorioDeCriacoes } from "../portas";

/** O formato do documento no DocumentDB: os campos dos dois tipos de Criação, opcionais. */
type Documento = {
  _id: string;
  tipo: Criacao["tipo"];
  status: Criacao["status"];
  motivo?: string;
  recusada?: boolean;
  texto?: string;
  voz?: string;
  chaveAudio?: string;
  descricao?: string;
  chaveImagem?: string;
  prompt?: string;
};

const soNarracao = function (this: Documento) {
  return this.tipo === "narracao";
};
const soImagem = function (this: Documento) {
  return this.tipo === "imagem";
};

// Um documento por Criação. Os campos de cada tipo ficam no mesmo documento: o formato
// flexível do DocumentDB é justamente para isso (ADR 0004).
const esquemaCriacao = new Schema<Documento>(
  {
    _id: { type: String, required: true }, // o criacaoId é a própria chave do documento
    tipo: { type: String, required: true, enum: ["narracao", "imagem"] },
    status: { type: String, required: true, enum: ["na-fila", "pronta", "falhou"] },
    motivo: String,
    recusada: Boolean, // a falha foi uma recusa definitiva do provedor (ADR 0012)
    // Narração
    texto: { type: String, required: soNarracao },
    voz: { type: String, required: soNarracao },
    chaveAudio: String,
    // Imagem (o Prompt é o que de fato foi enviado ao modelo: um "metadado da IA")
    descricao: { type: String, required: soImagem },
    chaveImagem: String,
    prompt: String,
  },
  { timestamps: { createdAt: "criadaEm", updatedAt: "atualizadaEm" }, versionKey: false },
);
// A Biblioteca lista da mais nova para a mais antiga; o _id desempata Criações do mesmo milissegundo
esquemaCriacao.index({ criadaEm: -1, _id: -1 });
esquemaCriacao.index({ tipo: 1, criadaEm: -1, _id: -1 });

function paraCriacao(doc: Documento): Criacao {
  const { _id: criacaoId, tipo, status, motivo } = doc;
  const comum = { criacaoId, status, motivo, ...(doc.recusada ? { recusada: true } : {}) };
  if (tipo === "imagem") return { ...comum, tipo, descricao: doc.descricao!, chaveImagem: doc.chaveImagem, prompt: doc.prompt };
  return { ...comum, tipo, texto: doc.texto!, voz: doc.voz!, chaveAudio: doc.chaveAudio };
}

export function criarRepositorioMongo(conexao: Connection): RepositorioDeCriacoes {
  const Criacoes = conexao.model("Criacao", esquemaCriacao, "criacoes");

  return {
    async criar({ criacaoId, ...resto }) {
      await Criacoes.create({ _id: criacaoId, ...resto });
    },
    async buscar(criacaoId) {
      const doc = await Criacoes.findById(criacaoId).lean<Documento>();
      return doc ? paraCriacao(doc) : null;
    },
    async listar({ limite, depoisDe, tipo }) {
      // Paginação por "cursor": continua logo depois da última Criação da página anterior
      const ultima = depoisDe ? await Criacoes.findById(depoisDe, { criadaEm: 1 }).lean<{ criadaEm: Date }>() : null;
      const filtro = {
        ...(tipo ? { tipo } : {}),
        ...(ultima ? { $or: [{ criadaEm: { $lt: ultima.criadaEm } }, { criadaEm: ultima.criadaEm, _id: { $lt: depoisDe } }] } : {}),
      };
      const docs = await Criacoes.find(filtro).sort({ criadaEm: -1, _id: -1 }).limit(limite).lean<Documento[]>();
      return docs.map(paraCriacao);
    },
    // $set é idempotente: aplicar o mesmo aviso duas vezes deixa o documento igual
    async marcarPronta(criacaoId, resultado) {
      await Criacoes.updateOne({ _id: criacaoId }, { $set: { status: "pronta", ...resultado } });
    },
    async marcarFalhou(criacaoId, motivo, opcoes) {
      await Criacoes.updateOne({ _id: criacaoId }, { $set: { status: "falhou", motivo, ...(opcoes?.definitiva ? { recusada: true } : {}) } });
    },
    async apagar(criacaoId) {
      await Criacoes.deleteOne({ _id: criacaoId });
    },
  };
}
