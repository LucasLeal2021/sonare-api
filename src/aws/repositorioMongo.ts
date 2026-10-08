import { Schema, type Connection } from "mongoose";
import type { Criacao, RepositorioDeCriacoes } from "../portas";

const esquemaCriacao = new Schema(
  {
    _id: { type: String, required: true }, // o criacaoId é a própria chave do documento
    tipo: { type: String, required: true, enum: ["narracao"] },
    texto: { type: String, required: true },
    voz: { type: String, required: true },
    status: { type: String, required: true, enum: ["na-fila", "pronta", "falhou"] },
    chaveAudio: String,
    motivo: String,
  },
  { timestamps: { createdAt: "criadaEm", updatedAt: "atualizadaEm" }, versionKey: false },
);
// A Biblioteca lista da mais nova para a mais antiga; o _id desempata Criações do mesmo milissegundo
esquemaCriacao.index({ criadaEm: -1, _id: -1 });

type Documento = { _id: string; tipo: "narracao"; texto: string; voz: string; status: Criacao["status"]; chaveAudio?: string; motivo?: string };

const paraCriacao = ({ _id, tipo, texto, voz, status, chaveAudio, motivo }: Documento): Criacao => ({
  criacaoId: _id,
  tipo,
  texto,
  voz,
  status,
  chaveAudio,
  motivo,
});

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
    async listar({ limite, depoisDe }) {
      // Paginação por "cursor": continua logo depois da última Criação da página anterior
      let filtro = {};
      if (depoisDe) {
        const ultima = await Criacoes.findById(depoisDe, { criadaEm: 1 }).lean<{ criadaEm: Date }>();
        if (ultima) {
          filtro = { $or: [{ criadaEm: { $lt: ultima.criadaEm } }, { criadaEm: ultima.criadaEm, _id: { $lt: depoisDe } }] };
        }
      }
      const docs = await Criacoes.find(filtro).sort({ criadaEm: -1, _id: -1 }).limit(limite).lean<Documento[]>();
      return docs.map(paraCriacao);
    },
    // $set é idempotente: aplicar o mesmo aviso duas vezes deixa o documento igual
    async marcarPronta(criacaoId, chaveAudio) {
      await Criacoes.updateOne({ _id: criacaoId }, { $set: { status: "pronta", chaveAudio } });
    },
    async marcarFalhou(criacaoId, motivo) {
      await Criacoes.updateOne({ _id: criacaoId }, { $set: { status: "falhou", motivo } });
    },
  };
}
