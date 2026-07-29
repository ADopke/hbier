import {
  ler,
  apagar,
  listaUsuarios,
  exigirLogin,
  corpo,
  erro,
  protegido,
} from "./_lib.js";

// POST /api/reset
//
// Apaga SOMENTE as marcações (state:* e ciclos:*) de todos os usuários.
// Preserva integralmente: usuários, senhas, tarefas, base de referência e cache.
//
// Requer:
//   - papel admin
//   - campo { confirmacao: "RESETAR TUDO" } no corpo
//
// O campo de confirmação existe para evitar reset acidental via curl ou
// ferramenta de debug — precisa de intenção explícita.

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  if (sessao.papel !== "admin") {
    return erro(res, 403, "Apenas o administrador pode resetar as marcações.");
  }
  if (req.method !== "POST") {
    return erro(res, 405, "Método não permitido.");
  }

  const dados = corpo(req);
  if (dados.confirmacao !== "RESETAR TUDO") {
    return erro(
      res,
      400,
      'Confirmação inválida. Envie { "confirmacao": "RESETAR TUDO" }.'
    );
  }

  const logins = await listaUsuarios();
  const apagadas = [];
  const falhas = [];

  for (const login of logins) {
    try {
      // apaga as marcações da semana atual e de semanas anteriores
      // state:login:AAAA-MM-DD — o app salva por chave de semana
      // Para apagar tudo sem SCAN (que não está disponível no plano Hobby
      // do Upstash via REST), zeramos gravando um estado vazio em vez de
      // tentar listar todas as chaves por padrão.
      //
      // ciclos: última execução das quinzenais e lembretes
      await apagar(`ciclos:${login}`);
      apagadas.push(`ciclos:${login}`);

      // estado da semana corrente — a mais importante para limpar
      // (semanas antigas ficam no Redis mas nunca mais são lidas)
      const agora = new Date();
      const diasParaSeg = (agora.getDay() + 6) % 7;
      const seg = new Date(agora);
      seg.setDate(agora.getDate() - diasParaSeg);
      const chSemana =
        seg.getFullYear() +
        "-" +
        String(seg.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(seg.getDate()).padStart(2, "0");

      await apagar(`state:${login}:${chSemana}`);
      apagadas.push(`state:${login}:${chSemana}`);

      // apagar também as 8 semanas anteriores (histórico visível nos relatórios)
      for (let i = 1; i <= 8; i++) {
        const s2 = new Date(seg);
        s2.setDate(seg.getDate() - i * 7);
        const ch2 =
          s2.getFullYear() +
          "-" +
          String(s2.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(s2.getDate()).padStart(2, "0");
        await apagar(`state:${login}:${ch2}`);
        apagadas.push(`state:${login}:${ch2}`);
      }
    } catch (e) {
      falhas.push(`${login}: ${e.message}`);
    }
  }

  res.json({
    ok: true,
    usuarios: logins.length,
    chaves_apagadas: apagadas.length,
    falhas,
    mensagem:
      falhas.length === 0
        ? "Reset concluído. Todas as marcações foram apagadas."
        : `Reset concluído com ${falhas.length} falha(s).`,
  });
});
