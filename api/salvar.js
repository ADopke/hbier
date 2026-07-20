import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { semanaId, estado, config } = request.body;

    if (!semanaId) {
      return response.status(400).json({ error: 'Falta o identificador da semana' });
    }

    // Cria as tabelas necessárias se elas ainda não existirem no banco
    await sql`
      CREATE TABLE IF NOT EXISTS hbier_semanas (
        semana_id VARCHAR(50) PRIMARY KEY,
        estado JSONB NOT NULL,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS hbier_config (
        chave VARCHAR(50) PRIMARY KEY,
        valor JSONB NOT NULL
      );
    `;

    // Salva ou atualiza os checklists marcados da semana
    await sql`
      INSERT INTO hbier_semanas (semana_id, estado, updated_em)
      VALUES (${semanaId}, ${JSON.stringify(estado)}, NOW())
      ON CONFLICT (semana_id) 
      DO UPDATE SET estado = ${JSON.stringify(estado)}, atualizado_em = NOW();
    `;

    // Salva as configurações extras da tela (ex: se o sábado está visível)
    if (config) {
      await sql`
        INSERT INTO hbier_config (chave, valor)
        VALUES ('global', ${JSON.stringify(config)})
        ON CONFLICT (chave) 
        DO UPDATE SET valor = ${JSON.stringify(config)};
      `;
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Erro interno do servidor ao salvar no banco' });
  }
}