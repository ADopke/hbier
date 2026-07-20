import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Método não permitido' });
  }

  const { semanaId } = request.query;

  if (!semanaId) {
    return response.status(400).json({ error: 'Falta o parâmetro semanaId' });
  }

  try {
    // Procura no banco se já existem dados salvos para essa semana
    const semanaQuery = await sql`
      SELECT estado FROM hbier_semanas WHERE semana_id = ${semanaId};
    `;

    // Busca as configurações globais do aplicativo
    const configQuery = await sql`
      SELECT valor FROM hbier_config WHERE chave = 'global';
    `;

    const estado = semanaQuery.rows.length > 0 ? semanaQuery.rows[0].estado : null;
    const config = configQuery.rows.length > 0 ? configQuery.rows[0].valor : null;

    return response.status(200).json({ estado, config });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Erro ao buscar dados do banco' });
  }
}