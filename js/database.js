(function () {
  var url = window.__SUPABASE_URL__;
  var key = window.__SUPABASE_ANON_KEY__;

  if (!url || !key) {
    console.warn(
      '%c\u26A0 El 42 Motos \u2014 Supabase no configurado\n' +
        '%cCre\u00E1 js/supabase-config.js a partir de js/supabase-config.example.js con tus credenciales de Supabase.',
      'font-weight:bold;font-size:14px',
      'color:#F2E600'
    );
    window.__SUPABASE__ = null;
    return;
  }

  try {
    window.__SUPABASE__ = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    console.log('%c\u2713 Supabase conectado', 'color:#25D366;font-weight:bold');
  } catch (err) {
    console.error('Error al inicializar Supabase:', err);
    window.__SUPABASE__ = null;
  }
})();
