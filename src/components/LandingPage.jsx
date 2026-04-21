import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [countersAnimated, setCountersAnimated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroStatsRef = useRef(null);

  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(el => observer.observe(el));

    // Counter animation
    const animateCounter = (el, target, suffix = '') => {
      let count = 0;
      const step = Math.ceil(target / 60);
      const timer = setInterval(() => {
        count = Math.min(count + step, target);
        el.textContent = count + suffix;
        if (count >= target) clearInterval(timer);
      }, 25);
    };

    const handleCounterAnimation = () => {
      if (!countersAnimated && heroStatsRef.current) {
        const rect = heroStatsRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const statNums = heroStatsRef.current.querySelectorAll('.hero-stat-num');
          animateCounter(statNums[0], 500, '+');
          animateCounter(statNums[1], 15, '+');
          animateCounter(statNums[2], 98, '%');
          setCountersAnimated(true);
        }
      }
    };

    window.addEventListener('scroll', handleCounterAnimation);
    handleCounterAnimation(); // Check on mount

    // Active nav link highlighting
    const handleScroll = () => {
      let current = '';
      document.querySelectorAll('section[id]').forEach(s => {
        if (window.scrollY >= s.offsetTop - 100) current = s.id;
      });
      document.querySelectorAll('.nav-links a').forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + current ? 'var(--choc)' : '';
      });
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleCounterAnimation);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [countersAnimated]);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    alert('Thank you! Our team will contact you within 60 minutes to confirm your booking.');
  };

  return (
    <>
      <style>{`
        :root {
          --choc:        #7B3520;
          --choc-light:  #A0522D;
          --choc-pale:   #C8896A;
          --choc-ghost:  #ECDDD6;
          --red:         #B83028;
          --red-light:   #D44040;
          --bg:          #FDF6F0;
          --bg2:         #F5E8DC;
          --bg3:         #EEDDD0;
          --bg4:         #E6CEC0;
          --text:        #2C1008;
          --text-muted:  #8A6050;
          --white:       #FFFFFF;
          --border:      rgba(123,53,32,0.14);
          --border-med:  rgba(123,53,32,0.28);
          --shadow:      0 4px 24px rgba(123,53,32,0.10);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; font-weight: 400; overflow-x: hidden; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg2); }
        ::-webkit-scrollbar-thumb { background: var(--choc-pale); border-radius: 3px; }

        /* NAV */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 48px; height: 68px;
          background: rgba(253,246,240,0.95); backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 2px 16px rgba(123,53,32,0.07);
          animation: slideDown 0.7s ease both;
        }
        @keyframes slideDown { from { transform: translateY(-100%); opacity:0; } to { transform: none; opacity:1; } }
        .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .nav-logo-icon {
          width: 38px; height: 38px; background: var(--choc);
          clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: var(--white); flex-shrink: 0;
        }
        .nav-logo-text { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 3px; color: var(--text); }
        .nav-logo-text span { color: var(--choc); }
        .nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
        .nav-links a {
          font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted);
          text-decoration: none; transition: color 0.2s; position: relative;
        }
        .nav-links a::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 2px; background: var(--choc);
          transform: scaleX(0); transform-origin: left; transition: transform 0.25s;
        }
        .nav-links a:hover { color: var(--choc); }
        .nav-links a:hover::after { transform: scaleX(1); }
        .nav-cta { background: var(--choc) !important; color: var(--white) !important; padding: 9px 22px; border-radius: 2px; font-weight: 700 !important; letter-spacing: 1px !important; transition: background 0.2s !important; }
        .nav-cta:hover { background: var(--red) !important; }
        .nav-cta::after { display: none !important; }

        /* MOBILE MENU TOGGLE */
        .mobile-menu-toggle {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 18px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 101;
        }
        .hamburger-line {
          width: 100%;
          height: 2px;
          background: var(--choc);
          border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }
        .hamburger-line.open:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .hamburger-line.open:nth-child(2) {
          opacity: 0;
        }
        .hamburger-line.open:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        /* HERO */
        #hero { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; position: relative; padding: 100px 0 0; overflow: hidden; }
        .hero-video {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover; z-index: 0;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 70% 50%, rgba(0,0,0,0.3) 0%, transparent 70%),
                      radial-gradient(ellipse 50% 40% at 5% 80%, rgba(0,0,0,0.4) 0%, transparent 60%),
                      linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%);
          z-index: 1;
        }
        .hero-grid {
          position: absolute; inset: 0; z-index: 0; opacity: 0.07;
          background-image: linear-gradient(rgba(123,53,32,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(123,53,32,0.5) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .hero-diagonal { position: absolute; top: 0; right: -100px; bottom: 0; width: 55%; background: var(--bg2); clip-path: polygon(20% 0%,100% 0%,100% 100%,0% 100%); z-index: 0; }
        .hero-accent-band { position: absolute; right: 0; top: 0; bottom: 0; width: 6px; background: linear-gradient(180deg, var(--red) 0%, var(--choc) 100%); z-index: 3; }
        .hero-content { position: relative; z-index: 2; max-width: 100%; width: 100%; padding: 0 48px; }
        .hero-content-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(5px);
          border: none;
          border-radius: 0;
          padding: 0;
          box-shadow: none;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.6);
          padding: 6px 16px; border-radius: 2px;
          font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 2px; text-transform: uppercase; color: #ffffff;
          margin-bottom: 28px; animation: fadeUp 0.8s 0.2s ease both; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }
        .hero-badge::before { content: ''; width: 7px; height: 7px; background: var(--red); border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }
        .hero-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(60px,8vw,110px); line-height: 0.95; letter-spacing: 2px; color: #ffffff; text-shadow: 2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5); animation: fadeUp 0.8s 0.35s ease both; }
        .hero-title .accent { color: #ffffff; }
        .hero-sub { margin-top: 24px; font-size: 18px; font-weight: 300; color: #ffffff; line-height: 1.7; max-width: 500px; text-shadow: 1px 1px 4px rgba(0,0,0,0.8); animation: fadeUp 0.8s 0.5s ease both; }
        .hero-sub strong { color: #ffffff; font-weight: 600; }
        .hero-actions { margin-top: 44px; display: flex; gap: 16px; flex-wrap: wrap; animation: fadeUp 0.8s 0.65s ease both; }
        .btn-primary { background: var(--choc); color: var(--white); padding: 14px 36px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; border-radius: 2px; border: none; cursor: pointer; transition: background 0.2s, transform 0.15s; display: inline-block; }
        .btn-primary:hover { background: var(--red); transform: translateY(-2px); }
        .btn-secondary { background: transparent; color: #ffffff; padding: 14px 36px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; border-radius: 2px; border: 1.5px solid rgba(255,255,255,0.6); cursor: pointer; transition: border-color 0.2s, color 0.2s, transform 0.15s, background 0.2s; display: inline-block; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
        .btn-secondary:hover { border-color: #ffffff; color: #000000; background: rgba(255,255,255,0.9); transform: translateY(-2px); text-shadow: none; }
        .hero-stats { position: relative; z-index: 2; display: flex; gap: 0; margin-top: 72px; border-top: 1px solid var(--border); padding-top: 36px; max-width: 100%; width: 100%; padding-left: 48px; padding-right: 48px; animation: fadeUp 0.8s 0.8s ease both; }
        .hero-stat { flex: 1; padding-right: 32px; border-right: 1px solid var(--border); }
        .hero-stat:last-child { border-right: none; padding-right: 0; padding-left: 32px; }
        .hero-stat:nth-child(2) { padding-left: 32px; }
        .hero-stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 44px; color: #ffffff; line-height: 1; text-shadow: 1px 1px 3px rgba(0,0,0,0.6); }
        .hero-stat-label { font-size: 12px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; color: #ffffff; margin-top: 4px; text-shadow: 1px 1px 2px rgba(0,0,0,0.6); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }

        /* SECTION BASE */
        section { padding: 24px 48px; }
        .section-label { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--choc); margin-bottom: 12px; display: flex; align-items: center; gap: 12px; }
        .section-label::before { content: ''; width: 32px; height: 2px; background: var(--choc); }
        .section-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(38px,5vw,64px); line-height: 1; letter-spacing: 1px; color: var(--text); }
        .section-subtitle { margin-top: 12px; font-size: 16px; font-weight: 300; color: var(--text-muted); max-width: 560px; line-height: 1.7; }

        /* SERVICES */
        #services { background: var(--bg2); }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2px; margin-top: 32px; }
        .service-card { background: var(--white); padding: 40px 36px; position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; cursor: default; border: 1px solid var(--border); }
        .service-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--choc), var(--red)); transform: scaleX(0); transform-origin: left; transition: transform 0.35s; }
        .service-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
        .service-card:hover::before { transform: scaleX(1); }
        .service-icon { width: 56px; height: 56px; background: rgba(123,53,32,0.08); border: 1px solid var(--border-med); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 24px; }
        .service-num { position: absolute; top: 28px; right: 28px; font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: rgba(123,53,32,0.06); line-height: 1; }
        .service-title { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 1px; color: var(--text); margin-bottom: 12px; }
        .service-desc { font-size: 14px; color: var(--text-muted); line-height: 1.7; }
        .service-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
        .service-tag { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; background: rgba(123,53,32,0.07); border: 1px solid var(--border-med); color: var(--choc); border-radius: 2px; }

        /* PROCESS */
        #process { background: var(--bg); }
        .process-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; margin-top: 64px; }
        .process-steps { display: flex; flex-direction: column; gap: 0; }
        .process-step { display: flex; gap: 24px; padding: 28px 0; border-bottom: 1px solid var(--border); position: relative; }
        .process-step:last-child { border-bottom: none; }
        .step-num { font-family: 'Bebas Neue', sans-serif; font-size: 42px; color: var(--choc-ghost); line-height: 1; flex-shrink: 0; width: 52px; text-align: right; transition: color 0.2s; }
        .process-step:hover .step-num { color: var(--choc); }
        .step-title { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; color: var(--text); margin-bottom: 6px; }
        .step-desc { font-size: 14px; color: var(--text-muted); line-height: 1.65; }
        .process-visual { position: relative; height: 500px; background: var(--white); border-radius: 4px; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow); }
        .process-visual-inner { padding: 40px; display: flex; flex-direction: column; gap: 20px; height: 100%; }
        .pv-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: var(--choc); }
        .checklist-item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--border); }
        .check-icon { width: 22px; height: 22px; background: rgba(184,48,40,0.08); border: 1px solid rgba(184,48,40,0.3); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--red); }
        .check-text { font-size: 14px; color: var(--text-muted); line-height: 1.5; }
        .check-text strong { color: var(--text); font-weight: 600; }

        /* COVERAGE */
        #coverage { background: var(--bg2); position: relative; overflow: hidden; }
        .coverage-bg-text { position: absolute; bottom: -40px; right: -20px; font-family: 'Bebas Neue', sans-serif; font-size: 220px; line-height: 1; color: rgba(123,53,32,0.04); pointer-events: none; white-space: nowrap; }
        .coverage-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 24px; }
        .cities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 52px; }
        .city-card { background: var(--white); border: 1px solid var(--border); padding: 20px 22px; border-radius: 3px; display: flex; align-items: center; gap: 14px; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; cursor: default; }
        .city-card:hover { border-color: var(--choc-pale); transform: translateY(-2px); box-shadow: var(--shadow); }
        .city-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--choc); flex-shrink: 0; box-shadow: 0 0 8px rgba(123,53,32,0.35); }
        .city-dot.new { background: var(--red); box-shadow: 0 0 8px rgba(184,48,40,0.35); }
        .city-name { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: var(--text); }
        .city-status { font-size: 11px; color: var(--text-muted); letter-spacing: 0.5px; }
        .city-status.new-status { color: var(--red); }
        .coverage-note { margin-top: 36px; padding: 18px 24px; background: rgba(123,53,32,0.05); border-left: 3px solid var(--choc); font-size: 14px; color: var(--text-muted); line-height: 1.6; }
        .coverage-note strong { color: var(--choc); }

        /* WHY US */
        #why { background: var(--bg); }
        .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin-top: 56px; }
        .why-card { background: var(--white); padding: 44px 40px; position: relative; overflow: hidden; border: 1px solid var(--border); }
        .why-card.large { grid-column: span 2; }
        .why-card-accent { position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(123,53,32,0.07) 0%, transparent 70%); border-radius: 50%; }
        .why-icon { font-size: 36px; margin-bottom: 20px; }
        .why-title { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; color: var(--text); margin-bottom: 12px; }
        .why-desc { font-size: 15px; color: var(--text-muted); line-height: 1.7; }
        .why-card.dark-alt { background: var(--bg2); }
        .certifications { display: flex; gap: 16px; margin-top: 28px; flex-wrap: wrap; }
        .cert-badge { padding: 8px 16px; border: 1px solid var(--border-med); border-radius: 2px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--choc); background: rgba(123,53,32,0.06); }

        /* TEAM */
        #team { background: var(--bg3); }
        .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 2px; margin-top: 56px; }
        .team-card { background: var(--white); padding: 36px 28px; text-align: center; position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; border: 1px solid var(--border); }
        .team-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
        .team-avatar { width: 76px; height: 76px; border-radius: 50%; background: var(--bg2); margin: 0 auto 20px; border: 2px solid var(--border-med); display: flex; align-items: center; justify-content: center; font-size: 30px; position: relative; }
        .team-avatar .status-dot { position: absolute; bottom: 3px; right: 3px; width: 12px; height: 12px; border-radius: 50%; background: #48A870; border: 2px solid var(--white); }
        .team-name { font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .team-role { font-size: 13px; color: var(--choc); font-weight: 500; margin-bottom: 6px; }
        .team-location { font-size: 12px; color: var(--text-muted); }
        .team-inspections { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-muted); }
        .team-inspections strong { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: var(--text); display: block; }

        /* BOOKING */
        #booking { background: linear-gradient(135deg, var(--bg) 0%, var(--bg2) 100%); position: relative; overflow: hidden; }
        .booking-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 70% at 30% 50%, rgba(123,53,32,0.05) 0%, transparent 70%); }
        .booking-wrap { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .booking-form { background: var(--white); border: 1px solid var(--border); border-radius: 4px; padding: 44px; box-shadow: var(--shadow); }
        .form-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 2px; margin-bottom: 32px; color: var(--text); }
        .form-row { margin-bottom: 18px; }
        .form-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
        .form-input, .form-select { width: 100%; background: var(--bg); border: 1.5px solid var(--border); border-radius: 2px; padding: 12px 16px; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 14px; transition: border-color 0.2s; appearance: none; }
        .form-input:focus, .form-select:focus { outline: none; border-color: var(--choc); }
        .form-input::placeholder { color: rgba(138,96,80,0.4); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-submit { width: 100%; margin-top: 8px; background: var(--choc); color: var(--white); border: none; border-radius: 2px; padding: 15px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: background 0.2s; }
        .form-submit:hover { background: var(--red); }
        .booking-features { margin-top: 40px; display: flex; flex-direction: column; gap: 24px; }
        .booking-feature { display: flex; gap: 18px; align-items: flex-start; }
        .bf-icon { width: 44px; height: 44px; flex-shrink: 0; background: rgba(123,53,32,0.08); border: 1px solid var(--border-med); border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .bf-title { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .bf-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

        /* TESTIMONIALS */
        #testimonials { background: var(--bg2); }
        .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2px; margin-top: 56px; }
        .testimonial-card { background: var(--white); padding: 36px; position: relative; border: 1px solid var(--border); }
        .testimonial-card::before { content: '"'; position: absolute; top: 24px; right: 28px; font-family: 'Bebas Neue', sans-serif; font-size: 80px; color: rgba(123,53,32,0.06); line-height: 1; }
        .stars { display: flex; gap: 4px; margin-bottom: 18px; color: var(--choc); font-size: 14px; }
        .testimonial-text { font-size: 15px; color: var(--text-muted); line-height: 1.75; font-style: italic; margin-bottom: 24px; }
        .testimonial-author { display: flex; align-items: center; gap: 14px; }
        .author-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--bg2); border: 2px solid var(--border-med); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .author-name { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }
        .author-info { font-size: 12px; color: var(--text-muted); }

        /* FOOTER */
        footer { background: var(--choc); color: rgba(255,255,255,0.85); padding: 64px 48px 32px; }
        .footer-top { display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.14); }
        .footer-brand-name { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 4px; color: var(--white); margin-bottom: 4px; }
        .footer-brand-name span { color: var(--choc-pale); }
        .footer-tagline { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6; margin-top: 12px; }
        .footer-contact { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }
        .footer-contact-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.65); }
        .footer-contact-item .icon { color: var(--choc-pale); font-size: 14px; }
        .footer-col-title { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--white); margin-bottom: 20px; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-links a { font-size: 14px; color: rgba(255,255,255,0.6); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--choc-pale); }
        .footer-bottom { padding-top: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .footer-copy { font-size: 13px; color: rgba(255,255,255,0.5); }
        .footer-copy span { color: var(--choc-pale); }
        .footer-legal { display: flex; gap: 24px; }
        .footer-legal a { font-size: 12px; color: rgba(255,255,255,0.45); text-decoration: none; letter-spacing: 0.5px; }
        .footer-legal a:hover { color: var(--choc-pale); }

        /* MOBILE */
        @media (max-width: 900px) {
          nav { padding: 0 20px; position: relative; } 
          .mobile-menu-toggle { display: flex; position: absolute; right: 48px; top: 50%; transform: translateY(-50%); }
          .nav-links { 
            display: none; 
            position: fixed; 
            top: 68px; 
            left: 0; 
            right: 0; 
            background: rgba(253,246,240,0.98); 
            backdrop-filter: blur(14px);
            flex-direction: column; 
            gap: 0; 
            padding: 20px; 
            border-bottom: 1px solid var(--border);
            box-shadow: 0 4px 16px rgba(123,53,32,0.1);
            z-index: 100;
          }
          .nav-links.mobile-open { display: flex; }
          .nav-links li { width: 100%; }
          .nav-links a { 
            display: block; 
            padding: 16px 0; 
            border-bottom: 1px solid var(--border); 
            text-align: center;
            font-size: 16px;
          }
          .nav-links a:last-child { border-bottom: none; }
          .nav-cta { 
            background: var(--choc) !important; 
            color: var(--white) !important; 
            margin: 8px 0;
            border-radius: 4px !important;
          }
          section { padding: 64px 20px; } #hero { padding: 100px 20px 48px; }
          .hero-diagonal { display: none; }
          .process-grid { grid-template-columns: 1fr; gap: 40px; } .process-visual { height: 360px; }
          .why-grid { grid-template-columns: 1fr; } .why-card.large { grid-column: span 1; }
          .booking-wrap { grid-template-columns: 1fr; gap: 40px; }
          .footer-top { grid-template-columns: 1fr 1fr; }
          .hero-stats { flex-direction: column; gap: 20px; }
          .hero-stat { border-right: none; border-bottom: 1px solid var(--border); padding: 0 0 16px 0 !important; }
          .hero-stat:last-child { border-bottom: none; }
        }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: none; }
      `}</style>

      <nav>
        <a className="nav-logo" href="#">
          <img src="/carnalysysnew1.jpg" alt="CARNALYSYS Logo" style={{width: "50px", height: "50px", objectFit: "contain"}} />
          <span className="nav-logo-text">CAR<span>NALYSYS</span></span>
        </a>
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>
        <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <li><a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a></li>
          <li><a href="#process" onClick={() => setMobileMenuOpen(false)}>Process</a></li>
          <li><a href="#coverage" onClick={() => setMobileMenuOpen(false)}>Coverage</a></li>
          <li><a href="#why" onClick={() => setMobileMenuOpen(false)}>Why Us</a></li>
          <li><a href="#team" onClick={() => setMobileMenuOpen(false)}>Inspectors</a></li>
          <li><a href="#booking" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>Book Inspection</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); setMobileMenuOpen(false); }} className="nav-cta">Admin Login</a></li>
        </ul>
      </nav>

      <section id="hero">
        <video 
          className="hero-video" 
          autoPlay 
          muted 
          loop 
          playsInline 
          controls={false} 
          preload="auto"
          onError={(e) => console.error('Video error:', e)}
          onCanPlay={() => console.log('Video can play')}
        >
          <source src="/carnalysysvideo.mp4" type="video/mp4" />
          <source src="/carnalysysvideo.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-content-wrapper"></div>
        <div className="hero-content">
          <div className="hero-badge">Odisha's Premier Vehicle PDI Network</div>
          <h1 className="hero-title">INSPECT<br/>BEFORE<br/><span className="accent">YOU DRIVE</span></h1>
          <p className="hero-sub"><strong>CARNALYSYS</strong> delivers certified Pre-Delivery Inspections across Odisha. Our network of expert inspectors ensures your vehicle is truly delivery-ready — before you sign.</p>
          <div className="hero-actions">
            <a href="#booking" className="btn-primary">Book an Inspection</a>
            <a href="#process" className="btn-secondary">See How It Works</a>
          </div>
        </div>
        <div className="hero-stats" ref={heroStatsRef}>
          <div className="hero-stat"><div className="hero-stat-num">300+</div><div className="hero-stat-label">PDIs Completed</div></div>
          <div className="hero-stat"><div className="hero-stat-num">15+</div><div className="hero-stat-label">Cities in Odisha</div></div>
          <div className="hero-stat"><div className="hero-stat-num">99.99%</div><div className="hero-stat-label">Satisfaction Rate</div></div>
        </div>
      </section>

      <section id="services">
        <div className="section-label">What We Offer</div>
        <h2 className="section-title reveal">COMPREHENSIVE<br/>PDI SERVICES</h2>
        <p className="section-subtitle reveal">End-to-end inspection solutions for new and used 4-wheelers — delivered with precision, transparency, and speed.</p>
        <div className="services-grid">
          <div className="service-card reveal">
            <div className="service-icon">🔍</div>
            <div className="service-num">01</div>
            <div className="service-title">New Vehicle PDI</div>
            <div className="service-desc">Rigorous pre-delivery check before you take possession from the dealership. We verify all factory parameters, accessories, and documentation to protect your investment.</div>
            <div className="service-tags">
              <span className="service-tag">Dealership Visit</span>
              <span className="service-tag">Full Checklist</span>
              <span className="service-tag">Digital Report</span>
            </div>
          </div>
          <div className="service-card reveal">
            <div className="service-icon">🚗</div>
            <div className="service-num">02</div>
            <div className="service-title">Used Car Inspection</div>
            <div className="service-desc">Buying a second-hand vehicle? Our inspectors assess bodywork, mechanical health, electrical systems, and odometer authenticity so you buy with confidence.</div>
            <div className="service-tags">
              <span className="service-tag">Body Inspection</span>
              <span className="service-tag">Engine Health</span>
              <span className="service-tag">ODO Verification</span>
            </div>
          </div>
          <div className="service-card reveal">
            <div className="service-icon">📋</div>
            <div className="service-num">03</div>
            <div className="service-title">Documentation Audit</div>
            <div className="service-desc">We verify all essential paperwork — RC, insurance, PUC, invoice — confirming authenticity and compliance before handover.</div>
            <div className="service-tags">
              <span className="service-tag">RC Check</span>
              <span className="service-tag">Insurance Verify</span>
              <span className="service-tag">Invoice Audit</span>
            </div>
          </div>
          <div className="service-card reveal">
            <div className="service-icon">⚡</div>
            <div className="service-num">04</div>
            <div className="service-title">EV & CNG Inspection</div>
            <div className="service-desc">Specialized inspection protocols for electric and CNG vehicles — covering battery health, range calibration, CNG kit certification, and charging systems.</div>
            <div className="service-tags">
              <span className="service-tag">Battery SOH</span>
              <span className="service-tag">Range Test</span>
              <span className="service-tag">CNG Certified</span>
            </div>
          </div>
          <div className="service-card reveal">
            <div className="service-icon">📱</div>
            <div className="service-num">05</div>
            <div className="service-title">Digital Inspection Report</div>
            <div className="service-desc">Every inspection generates a tamper-proof digital report with photographic evidence, inspector sign-off, and a shareable PDF — delivered within 2 hours.</div>
            <div className="service-tags">
              <span className="service-tag">With Photos</span>
              <span className="service-tag">Shareable PDF</span>
              <span className="service-tag">2-Hr Delivery</span>
            </div>
          </div>
          <div className="service-card reveal">
            <div className="service-icon">🤝</div>
            <div className="service-num">06</div>
            <div className="service-title">Dealer Coordination</div>
            <div className="service-desc">We liaise directly with dealerships on your behalf — coordinating inspection timings, flagging defects, and ensuring rectification before you take delivery.</div>
            <div className="service-tags">
              <span className="service-tag">Defect Flagging</span>
              <span className="service-tag">Follow-Up</span>
              <span className="service-tag">On Your Behalf</span>
            </div>
          </div>
        </div>
      </section>

      <section id="process">
        <div className="section-label">How It Works</div>
        <h2 className="section-title reveal">SIMPLE.<br/>TRANSPARENT.<br/>TRUSTED.</h2>
        <div className="process-grid">
          <div className="process-steps reveal">
            <div className="process-step">
              <div className="step-num">01</div>
              <div className="step-content">
                <div className="step-title">Book Online or via App</div>
                <div className="step-desc">Submit your vehicle details and preferred inspection date through our web portal or mobile app. Choose from available inspectors near the vehicle location.</div>
              </div>
            </div>
            <div className="process-step">
              <div className="step-num">02</div>
              <div className="step-content">
                <div className="step-title">Inspector Assigned & Confirmed</div>
                <div className="step-desc">A certified CARNALYSYS inspector in your city is assigned within 60 minutes. You receive their profile, credentials, and ETA via SMS & app notification.</div>
              </div>
            </div>
            <div className="process-step">
              <div className="step-num">03</div>
              <div className="step-content">
                <div className="step-title">On-Site Inspection</div>
                <div className="step-desc">Our inspector visits the dealership or seller location and conducts a thorough 120-point check covering exterior, interior, mechanical, and documentation.</div>
              </div>
            </div>
            <div className="process-step">
              <div className="step-num">04</div>
              <div className="step-content">
                <div className="step-title">Report Delivered to You</div>
                <div className="step-desc">A comprehensive digital report with images, findings, and a Go/No-Go recommendation is shared with you within 2 hours of inspection completion.</div>
              </div>
            </div>
            <div className="process-step">
              <div className="step-num">05</div>
              <div className="step-content">
                <div className="step-title">Decision — On Your Terms</div>
                <div className="step-desc">Based on the report, decide confidently whether to proceed with delivery, negotiate, or walk away. CARNALYSYS supports you throughout.</div>
              </div>
            </div>
          </div>
          <div className="process-visual reveal">
            <div className="process-visual-inner">
              <div className="pv-title">120-POINT CHECKLIST</div>
              <div className="checklist-item">
                <div className="check-icon">✓</div>
                <div className="check-text"><strong>Exterior Body</strong> — Panel alignment, paint quality, dents, scratches, VIN verification</div>
              </div>
              <div className="checklist-item">
                <div className="check-icon">✓</div>
                <div className="check-text"><strong>Glass & Lights</strong> — Windshield, windows, headlamps, indicators, taillamps</div>
              </div>
              <div className="checklist-item">
                <div className="check-icon">✓</div>
                <div className="check-text"><strong>Interior</strong> — Upholstery, dashboard electronics, HVAC, infotainment</div>
              </div>
              <div className="checklist-item">
                <div className="check-icon">✓</div>
                <div className="check-text"><strong>Engine Bay</strong> — Fluid levels, leaks, belt condition, battery terminals</div>
              </div>
              <div className="checklist-item">
                <div className="check-icon">✓</div>
                <div className="check-text"><strong>Under-Chassis</strong> — Suspension, exhaust, brake lines, tyres & wheels</div>
              </div>
              <div className="checklist-item">
                <div className="check-icon">✓</div>
                <div className="check-text"><strong>Road Test</strong> — Braking, steering, transmission response, NVH levels</div>
              </div>
              <div className="checklist-item">
                <div className="check-icon">✓</div>
                <div className="check-text"><strong>Documents</strong> — Invoice, RC, insurance, PUC, warranty card</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="coverage">
        <div className="coverage-bg-text">ODISHA</div>
        <div className="coverage-header">
          <div>
            <div className="section-label">Service Network</div>
            <h2 className="section-title reveal">WE COVER<br/>ODISHA</h2>
            <p className="section-subtitle reveal">Our inspector network spans 15+ cities across Odisha — from the capital to emerging towns.</p>
          </div>
        </div>
        <div className="cities-grid reveal">
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Bhubaneswar</div><div className="city-status">Active · 4 Inspectors</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Cuttack</div><div className="city-status">Active · 3 Inspectors</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Puri</div><div className="city-status">Active · 2 Inspectors</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Rourkela</div><div className="city-status">Active · 3 Inspectors</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Berhampur</div><div className="city-status">Active · 2 Inspectors</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Sambalpur</div><div className="city-status">Active · 2 Inspectors</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Balasore</div><div className="city-status">Active · 1 Inspector</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Baripada</div><div className="city-status">Active · 1 Inspector</div></div></div>
          <div className="city-card"><div className="city-dot new"></div><div><div className="city-name">Koraput</div><div className="city-status new-status">Coming Soon</div></div></div>
          <div className="city-card"><div className="city-dot new"></div><div><div className="city-name">Rayagada</div><div className="city-status new-status">Coming Soon</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Jharsuguda</div><div className="city-status">Active · 1 Inspector</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Paradip</div><div className="city-status">Active · 1 Inspector</div></div></div>
          <div className="city-card"><div className="city-dot new"></div><div><div className="city-name">Jeypore</div><div className="city-status new-status">Coming Soon</div></div></div>
          <div className="city-card"><div className="city-dot"></div><div><div className="city-name">Kendujhar</div><div className="city-status">Active · 1 Inspector</div></div></div>
          <div className="city-card"><div className="city-dot new"></div><div><div className="city-name">Phulbani</div><div className="city-status new-status">Coming Soon</div></div></div>
        </div>
        <div className="coverage-note reveal"><strong>Don't see your city?</strong> We're rapidly expanding our inspector network across Odisha. Contact us to request coverage in your area — we may be closer than you think.</div>
      </section>

      <section id="why">
        <div className="section-label">Our Advantage</div>
        <h2 className="section-title reveal">WHY CHOOSE<br/>CARNALYSYS</h2>
        <div className="why-grid reveal">
          <div className="why-card">
            <div className="why-card-accent"></div>
            <div className="why-icon">🎯</div>
            <div className="why-title">Certified & Trained Inspectors</div>
            <div className="why-desc">Every CARNALYSYS inspector is certified in automotive systems and undergoes rigorous PDI methodology training. They are independent, unbiased professionals — not affiliated with any dealership.</div>
            <div className="certifications">
              <span className="cert-badge">ISO Aligned</span>
              <span className="cert-badge">OEM Trained</span>
              <span className="cert-badge">Background Verified</span>
            </div>
          </div>
          <div className="why-card dark-alt">
            <div className="why-card-accent"></div>
            <div className="why-icon">⚡</div>
            <div className="why-title">Fast Turnaround</div>
            <div className="why-desc">Book in 2 minutes. Inspector confirmed in 60 minutes. Report delivered within 2 hours of inspection. Our streamlined digital-first workflow means you never wait long for answers.</div>
          </div>
          <div className="why-card dark-alt">
            <div className="why-card-accent"></div>
            <div className="why-icon">📸</div>
            <div className="why-title">Photo-Backed Reports</div>
            <div className="why-desc">Every finding is documented with high-resolution photographs and geo-tagged timestamps. Your report is tamper-proof, shareable, and legally admissible.</div>
          </div>
          <div className="why-card">
            <div className="why-card-accent"></div>
            <div className="why-icon">🛡️</div>
            <div className="why-title">100% Independent</div>
            <div className="why-desc">We are exclusively a customer-side inspection service. Zero financial relationship with dealerships, manufacturers, or lenders — your interests are our only interest.</div>
          </div>
          <div className="why-card large">
            <div className="why-card-accent"></div>
            <div className="why-icon">📲</div>
            <div className="why-title">Built for Odisha</div>
            <div className="why-desc">CARNALYSYS was built ground-up for the Odisha market. We understand local dealership practices, terrain-specific vehicle requirements, and the unique needs of buyers across coastal, urban, and tribal belt areas. Our inspectors speak Odia and know the market intimately — giving you an irreplaceable local edge.</div>
          </div>
        </div>
      </section>

      <section id="team">
        <div className="section-label">Inspector Network</div>
        <h2 className="section-title reveal">MEET OUR<br/>SPECIALISTS</h2>
        <p className="section-subtitle reveal">Our field inspectors are experienced automotive technicians and engineers placed strategically across Odisha.</p>
        <div className="team-grid reveal">
          <div className="team-card">
            <div className="team-avatar">🧑‍🔧<div className="status-dot"></div></div>
            <div className="team-name">Rajesh Pradhan</div>
            <div className="team-role">Lead Inspector</div>
            <div className="team-location">📍 Bhubaneswar</div>
            <div className="team-inspections"><strong>148</strong>Inspections Done</div>
          </div>
          <div className="team-card">
            <div className="team-avatar">👩‍🔧<div className="status-dot"></div></div>
            <div className="team-name">Priyanka Mohanty</div>
            <div className="team-role">Senior Inspector</div>
            <div className="team-location">📍 Cuttack</div>
            <div className="team-inspections"><strong>112</strong>Inspections Done</div>
          </div>
          <div className="team-card">
            <div className="team-avatar">🧑‍🔧<div className="status-dot"></div></div>
            <div className="team-name">Subrat Nayak</div>
            <div className="team-role">Inspector</div>
            <div className="team-location">📍 Rourkela</div>
            <div className="team-inspections"><strong>96</strong>Inspections Done</div>
          </div>
          <div className="team-card">
            <div className="team-avatar">🧑‍🔧<div className="status-dot"></div></div>
            <div className="team-name">Aditya Sahoo</div>
            <div className="team-role">Inspector</div>
            <div className="team-location">📍 Berhampur</div>
            <div className="team-inspections"><strong>87</strong>Inspections Done</div>
          </div>
          <div className="team-card">
            <div className="team-avatar">👩‍🔧<div className="status-dot"></div></div>
            <div className="team-name">Smita Dash</div>
            <div className="team-role">Inspector</div>
            <div className="team-location">📍 Sambalpur</div>
            <div className="team-inspections"><strong>74</strong>Inspections Done</div>
          </div>
          <div className="team-card">
            <div className="team-avatar">🧑‍🔧<div className="status-dot"></div></div>
            <div className="team-name">Bikash Rath</div>
            <div className="team-role">Inspector</div>
            <div className="team-location">📍 Puri</div>
            <div className="team-inspections"><strong>68</strong>Inspections Done</div>
          </div>
        </div>
      </section>

      <section id="testimonials">
        <div className="section-label">Customer Stories</div>
        <h2 className="section-title reveal">WHAT OUR<br/>CUSTOMERS SAY</h2>
        <div className="testimonials-grid reveal">
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">The CARNALYSYS report flagged a paint patch job on the bonnet that the dealer tried to hide. I nearly paid full price for a damaged vehicle. Saved me a huge amount!</p>
            <div className="testimonial-author">
              <div className="author-avatar">😊</div>
              <div>
                <div className="author-name">Deepak Mishra</div>
                <div className="author-info">Bhubaneswar · Maruti Baleno</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">Booked online at 10 PM, inspector confirmed by 9 AM next morning. The report was super detailed with 40+ photos. Very professional service.</p>
            <div className="testimonial-author">
              <div className="author-avatar">😊</div>
              <div>
                <div className="author-name">Sujata Panda</div>
                <div className="author-info">Cuttack · Hyundai Creta</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">Buying a used car in a new city was stressful. CARNALYSYS inspector in Rourkela visited the car within 24 hours. Report helped me negotiate ₹40,000 off.</p>
            <div className="testimonial-author">
              <div className="author-avatar">😊</div>
              <div>
                <div className="author-name">Manoj Kumar Singh</div>
                <div className="author-info">Rourkela · Tata Nexon</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="booking">
        <div className="booking-bg"></div>
        <div className="booking-wrap">
          <div className="booking-info reveal">
            <div className="section-label">Get Started</div>
            <h2 className="section-title">BOOK YOUR<br/>PDI TODAY</h2>
            <p className="section-subtitle">Fill in your details and we'll match you with the right inspector for your location. Quick, simple, and zero hassle.</p>
            <div className="booking-features">
              <div className="booking-feature">
                <div className="bf-icon">💰</div>
                <div>
                  <div className="bf-title">Transparent Pricing</div>
                  <div className="bf-desc">Flat-rate fees with no hidden charges. New car PDI starts at ₹999. Used car inspection from ₹1,499.</div>
                </div>
              </div>
              <div className="booking-feature">
                <div className="bf-icon">🕐</div>
                <div>
                  <div className="bf-title">Same-Day Availability</div>
                  <div className="bf-desc">In most cities, we can arrange inspection within 24 hours of booking — including weekends.</div>
                </div>
              </div>
              <div className="booking-feature">
                <div className="bf-icon">📞</div>
                <div>
                  <div className="bf-title">Dedicated Support</div>
                  <div className="bf-desc">Our customer support team in Bhubaneswar is available 9 AM – 8 PM, 7 days a week.</div>
                </div>
              </div>
            </div>
          </div>
          <form className="booking-form reveal" onSubmit={handleBookingSubmit}>
            <div className="form-title">REQUEST BOOKING</div>
            <div className="form-row">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="Your full name" required />
            </div>
            <div className="form-grid">
              <div className="form-row">
                <label className="form-label">Mobile Number</label>
                <input className="form-input" type="tel" placeholder="+91 XXXXXXXXXX" required />
              </div>
              <div className="form-row">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="you@email.com" required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-row">
                <label className="form-label">City / Location</label>
                <select className="form-select" required>
                  <option value="">Select City</option>
                  <option>Bhubaneswar</option>
                  <option>Cuttack</option>
                  <option>Puri</option>
                  <option>Rourkela</option>
                  <option>Berhampur</option>
                  <option>Sambalpur</option>
                  <option>Balasore</option>
                  <option>Baripada</option>
                  <option>Jharsuguda</option>
                  <option>Paradip</option>
                  <option>Kendujhar</option>
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Inspection Type</label>
                <select className="form-select" required>
                  <option value="">Select Type</option>
                  <option>New Car PDI</option>
                  <option>Used Car Inspection</option>
                  <option>EV Inspection</option>
                  <option>CNG Vehicle Inspection</option>
                  <option>Document Audit Only</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Vehicle Details</label>
              <input className="form-input" type="text" placeholder="e.g. Maruti Suzuki Baleno Delta 2024" required />
            </div>
            <div className="form-row">
              <label className="form-label">Preferred Inspection Date</label>
              <input className="form-input" type="date" required />
            </div>
            <button type="submit" className="form-submit">CONFIRM BOOKING REQUEST</button>
          </form>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-brand-name">CAR<span>NALYSYS</span></div>
            <div style={{fontSize:'12px', letterSpacing:'2px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase'}}>Pre-Delivery Inspection Specialists</div>
            <p className="footer-tagline">Odisha's trusted network of certified vehicle inspectors — <br/> ensuring every car you buy has been thoroughly checked before it's yours.</p>
            <div className="footer-contact">
              <div className="footer-contact-item"><span className="icon">📞</span>+91 6370166632</div>
              <div className="footer-contact-item"><span className="icon">✉️</span>carnalysysindia@gmail.com</div>
              <div className="footer-contact-item"><span className="icon">📍</span>Plot No. 4907, Kalinga Nagar, Ghatikia,<br/>Near Balia Square Bus Stand,<br/>Bhubaneswar, Odisha - 751001</div>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Services</div>
            <ul className="footer-links">
              <li><a href="#">New Car PDI</a></li>
              <li><a href="#">Used Car Inspection</a></li>
              <li><a href="#">EV Inspection</a></li>
              <li><a href="#">Document Audit</a></li>
              <li><a href="#">Dealer Coordination</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Coverage</div>
            <ul className="footer-links">
              <li><a href="#">Bhubaneswar</a></li>
              <li><a href="#">Cuttack</a></li>
              <li><a href="#">Rourkela</a></li>
              <li><a href="#">Berhampur</a></li>
              <li><a href="#">All Cities →</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Become an Inspector</a></li>
              <li><a href="#">Partner Dealerships</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 <span>CARNALYSYS</span>. All rights reserved. Built for Odisha.</div>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="https://www.intulet.com/">Powered By Intulet Technologies</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
