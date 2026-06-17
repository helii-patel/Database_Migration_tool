(async () => {
  try {
    const backend = await fetch('http://localhost:5000/health');
    console.log('Backend status:', backend.status);
    if (backend.headers.get('content-type')?.includes('application/json')) {
      console.log('Backend body:', await backend.json());
    }

    // Try common dev ports for Vite (5173) and fallback to 5174
    const ports = [process.env.FRONTEND_PORT || 5173, 5174];
    let frontend;
    let tried = [];
    for (const p of ports) {
      tried.push(p);
      try {
        frontend = await fetch(`http://localhost:${p}/`);
        console.log('Frontend status (port ' + p + '):', frontend.status);
        const text = await frontend.text();
        console.log('Frontend response length:', text.length);
        break;
      } catch (e) {
        // try next
      }
    }
    if (!frontend) throw new Error('Frontend not reachable on ports: ' + tried.join(', '));
  } catch (err) {
    console.error('Smoke test failed:', err.message || err);
    process.exit(1);
  }
})();
