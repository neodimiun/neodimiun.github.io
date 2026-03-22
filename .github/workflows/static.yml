<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Jose A. Fernandez Abreu, M.S.</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background-color: #0b1628;
      color: #ffffff;
      min-height: 100vh;
      overflow-x: hidden;
    }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(79,195,247,0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(79,195,247,0.045) 1px, transparent 1px);
      background-size: 64px 64px;
      pointer-events: none;
      z-index: 0;
    }

    body::after {
      content: '';
      position: fixed;
      top: -15%;
      left: 50%;
      transform: translateX(-50%);
      width: 900px;
      height: 700px;
      background: radial-gradient(ellipse, rgba(79,195,247,0.08) 0%, transparent 68%);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 28px;
    }

    .hero {
      text-align: center;
      padding: 76px 0 44px;
    }

    .headshot {
      width: 164px;
      height: 164px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(79,195,247,0.5);
      box-shadow:
        0 0 0 7px rgba(79,195,247,0.07),
        0 0 32px rgba(79,195,247,0.28),
        0 0 70px rgba(79,195,247,0.13);
      display: block;
      margin: 0 auto 28px;
    }

    .hero h1 {
      font-size: clamp(26px, 5vw, 42px);
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.4px;
      margin-bottom: 9px;
    }

    .hero-subtitle {
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      letter-spacing: 3.5px;
      text-transform: uppercase;
      color: #4fc3f7;
      margin-bottom: 26px;
    }

    .badge-row {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 4px;
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .badge-blue {
      background: rgba(79,195,247,0.07);
      border: 1px solid rgba(79,195,247,0.28);
      color: #4fc3f7;
    }

    .badge-gold {
      background: rgba(251,191,36,0.07);
      border: 1px solid rgba(251,191,36,0.42);
      color: #fbbf24;
    }

    .stats-bar {
      display: flex;
      align-items: stretch;
      border-top: 1px solid rgba(79,195,247,0.18);
      border-bottom: 1px solid rgba(79,195,247,0.18);
      margin: 44px 0;
    }

    .stat-item {
      flex: 1;
      text-align: center;
      padding: 20px 16px;
      position: relative;
    }

    .stat-item:not(:last-child)::after {
      content: '';
      position: absolute;
      right: 0; top: 15%;
      height: 70%;
      width: 1px;
      background: rgba(79,195,247,0.18);
    }

    .stat-number {
      display: block;
      font-family: 'Space Mono', monospace;
      font-size: clamp(20px, 4vw, 30px);
      font-weight: 700;
      color: #4fc3f7;
      line-height: 1;
      margin-bottom: 9px;
    }

    .stat-gold .stat-number { color: #fbbf24; }

    .stat-label {
      display: block;
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      color: rgba(255,255,255,0.4);
      letter-spacing: 2.2px;
      text-transform: uppercase;
    }

    .bio-section {
      padding-bottom: 52px;
    }

    .bio-section p {
      font-size: 15px;
      color: rgba(255,255,255,0.8);
      line-height: 1.88;
      margin-bottom: 22px;
    }

    .bio-section p:last-child { margin-bottom: 0; }

    .bio-section strong {
      color: #ffffff;
      font-weight: 600;
    }

    .bio-section a {
      color: #4fc3f7;
      text-decoration: none;
      border-bottom: 1px solid rgba(79,195,247,0.32);
      transition: border-color 0.2s;
    }

    .bio-section a:hover { border-color: #4fc3f7; }

    .bio-accent {
      border-left: 3px solid rgba(79,195,247,0.48);
      padding-left: 22px;
      padding-top: 4px;
      padding-bottom: 4px;
      background: rgba(79,195,247,0.03);
      border-radius: 0 4px 4px 0;
    }

    .section-label {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.28);
      margin-bottom: 18px;
      display: block;
    }

    .cards-section {
      padding-bottom: 44px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    .card {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(79,195,247,0.14);
      border-radius: 5px;
      padding: 24px 18px;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s, background 0.3s;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, #4fc3f7 0%, transparent 100%);
    }

    .card:hover {
      border-color: rgba(79,195,247,0.42);
      background: rgba(79,195,247,0.05);
    }

    .card-icon {
      font-size: 21px;
      margin-bottom: 13px;
      display: block;
    }

    .card-title {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #4fc3f7;
      margin-bottom: 11px;
      display: block;
    }

    .card p {
      font-size: 13px;
      color: rgba(255,255,255,0.62);
      line-height: 1.68;
    }

    .standards-section {
      padding-bottom: 60px;
      text-align: center;
    }

    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }

    .tag {
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      padding: 7px 15px;
      border-radius: 3px;
      text-transform: uppercase;
      transition: background 0.2s;
      cursor: default;
    }

    .tag-cyan {
      border: 1px solid rgba(79,195,247,0.32);
      color: #4fc3f7;
      background: rgba(79,195,247,0.05);
    }

    .tag-cyan:hover { background: rgba(79,195,247,0.12); }

    .tag-gold {
      border: 1px solid rgba(251,191,36,0.42);
      color: #fbbf24;
      background: rgba(251,191,36,0.05);
    }

    .tag-gold:hover { background: rgba(251,191,36,0.13); }

    footer {
      background: rgba(0,0,0,0.38);
      border-top: 1px solid rgba(79,195,247,0.13);
      padding: 32px 0;
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .footer-icons {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 18px;
    }

    .footer-icons a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(79,195,247,0.07);
      border: 1px solid rgba(79,195,247,0.22);
      color: #4fc3f7;
      font-size: 16px;
      text-decoration: none;
      transition: background 0.2s, border-color 0.2s, transform 0.2s;
    }

    .footer-icons a:hover {
      background: rgba(79,195,247,0.17);
      border-color: rgba(79,195,247,0.58);
      transform: translateY(-2px);
    }

    .footer-copy {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.22);
    }

    @media (max-width: 620px) {
      .cards-grid { grid-template-columns: 1fr; }
      .badge-row { flex-direction: column; align-items: center; }
      .stat-item { padding: 16px 8px; }
    }

    @media (max-width: 400px) {
      .badge { font-size: 9px; padding: 7px 12px; }
    }
  </style>
</head>
<body>

  <!-- ═══ HERO ═══ -->
  <section class="hero">
    <div class="container">
      <!-- REPLACE headshot.jpg with your actual image filename or URL -->
      <img src="https://drive.google.com/uc?export=view&id=15BWVhPEJXMqPzP-QeCEhveYxxrGMRBxe" alt="Jose A. Fernandez Abreu" class="headshot" />
      <h1>Jose A. Fernandez Abreu, M.S.</h1>
      <p class="hero-subtitle">Chemist &middot; Microbiologist &middot; Compliance Lead</p>
      <div class="badge-row">
        <span class="badge badge-blue">
          <i class="fas fa-jet-fighter"></i>
          Collins Aerospace &middot; Landing Systems &middot; RTX Business
        </span>
        <span class="badge badge-gold">
          ★&nbsp; NADCAP Gold Certified
        </span>
      </div>
    </div>
  </section>

  <!-- ═══ STATS BAR ═══ -->
  <div class="container">
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-number">10+</span>
        <span class="stat-label">Years Experience</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">3</span>
        <span class="stat-label">Regulated Industries</span>
      </div>
      <div class="stat-item stat-gold">
        <span class="stat-number">GOLD</span>
        <span class="stat-label">NADCAP Certified</span>
      </div>
    </div>
  </div>

  <!-- ═══ BIO ═══ -->
  <section class="bio-section">
    <div class="container">
      <p>
        I am a Master's-level Scientist and Compliance Lead with over a decade of experience supporting and overseeing high-volume, regulated laboratory operations across <strong>environmental enforcement</strong>, <strong>pharmaceutical validation</strong>, and <strong>aerospace manufacturing</strong>.
      </p>
      <p class="bio-accent">
        My work sits at the intersection of complex wet chemistry and regulatory compliance, with deep expertise in <strong>NADCAP, cGMP, EPA, NELAC, and USP</strong> standards. Currently, I apply this expertise at <strong>Collins Aerospace, an <a href="https://www.rtx.com/who-we-are/we-are-rtx" target="_blank" rel="noopener">RTX</a> business</strong>, within the <strong>Landing Systems</strong> division, where I provide analytical and compliance support for defense systems developed by one of the world's largest aerospace and defense organizations. Our laboratory holds <strong>NADCAP Gold Certification</strong>, reflecting the level of quality systems and process control this work demands.
      </p>
      <p>
        From overseeing wastewater analysis for municipal clients to conducting <strong>disinfectant validation studies</strong> and environmental monitoring of <strong>ISO 4 cleanrooms</strong> in sterile drug manufacturing, my approach has remained consistent: ensure audit-readiness through <strong>data integrity, traceability, and defensibility</strong>. I am driven by environments where technical precision has direct consequences for safety and operational success, and I remain committed to applying this disciplined methodology to the most demanding challenges in <strong>water management</strong>, <strong>pharmaceutical science</strong>, and <strong>aerospace engineering</strong>.
      </p>
    </div>
  </section>

  <!-- ═══ EXPERTISE CARDS ═══ -->
  <section class="cards-section">
    <div class="container">
      <span class="section-label">Areas of Expertise</span>
      <div class="cards-grid">
        <div class="card">
          <span class="card-icon">⚗️</span>
          <span class="card-title">Chemistry &amp; Microbiology</span>
          <p>Complex wet chemistry, environmental monitoring, disinfectant validation studies, and ISO 4 cleanroom sampling in sterile drug manufacturing.</p>
        </div>
        <div class="card">
          <span class="card-icon">📋</span>
          <span class="card-title">Regulatory Compliance</span>
          <p>Deep expertise in NADCAP, cGMP, EPA, NELAC, and USP standards. Audit-readiness built on data integrity, traceability, and defensibility.</p>
        </div>
        <div class="card">
          <span class="card-icon">✈️</span>
          <span class="card-title">Aerospace &amp; Defense</span>
          <p>Analytical and compliance support for critical defense systems at Collins Aerospace, Landing Systems Division, an RTX business.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ STANDARDS & CERTIFICATIONS ═══ -->
  <section class="standards-section">
    <div class="container">
      <span class="section-label">Standards &amp; Certifications</span>
      <div class="tags-row">
        <span class="tag tag-gold">NADCAP Gold</span>
        <span class="tag tag-cyan">cGMP</span>
        <span class="tag tag-cyan">EPA</span>
        <span class="tag tag-cyan">NELAC</span>
        <span class="tag tag-cyan">USP</span>
        <span class="tag tag-cyan">ISO 4</span>
        <span class="tag tag-cyan">FDA Regulated</span>
      </div>
    </div>
  </section>

  <!-- ═══ FOOTER ═══ -->
  <footer>
    <div class="footer-icons">
      <a href="https://drive.google.com/file/d/1FQXbq30I5GoH5onZDLqftWZvv_B0Z43d/view" target="_blank" rel="noopener" title="Download CV">
        <i class="fas fa-file-lines"></i>
      </a>
      <a href="mailto:jose@joseqc.com" title="Email">
        <i class="fas fa-envelope"></i>
      </a>
      <a href="https://github.com/fabreu08/CV" target="_blank" rel="noopener" title="GitHub">
        <i class="fab fa-github"></i>
      </a>
      <a href="https://www.linkedin.com/in/jf42/" target="_blank" rel="noopener" title="LinkedIn">
        <i class="fab fa-linkedin-in"></i>
      </a>
    </div>
    <p class="footer-copy">&copy; 2026 Jose A. Fernandez Abreu &middot; joseqc.com</p>
  </footer>

</body>
</html>
