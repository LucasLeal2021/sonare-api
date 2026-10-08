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

export function criarRepositorioMongo(conexao: Connection): RepositorioDeCriacoes {
  const Criacoes = conexao.model("Criacao", esquemaCriacao, "criacoes");

  return {
    async criar({ criacaoId, ...resto }) {
      await Criacoes.create({ _id: criacaoId, ...resto });
    },
    async buscar(criacaoId) {
      const doc = await Criacoes.findById(criacaoId).lean();
      if (!doc) return null;
      const { _id, tipo, texto, voz, status, chaveAudio, motivo } = doc;
      return { criacaoId: _id, tipo, texto, voz, status, chaveAudio, motivo } as Criacao;
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
