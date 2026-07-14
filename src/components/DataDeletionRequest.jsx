import React from 'react';
import { useNavigate } from 'react-router-dom';

const DataDeletionRequest = () => {
  const navigate = useNavigate();

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
        body { background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; font-weight: 400; }

        .page-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 120px 64px 80px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          background: var(--choc);
          border: none;
          border-radius: 4px;
          color: var(--white);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 40px;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(123,53,32,0.25);
        }

        .back-btn:hover {
          background: var(--red);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(184,48,40,0.35);
        }

        .header {
          text-align: center;
          margin-bottom: 56px;
          padding-bottom: 40px;
          border-bottom: 3px solid var(--choc);
        }

        .title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(48px, 6vw, 84px);
          letter-spacing: 4px;
          color: var(--choc);
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .subtitle {
          max-width: 900px;
          margin: 0 auto;
          font-size: 16px;
          line-height: 1.9;
          color: var(--text-muted);
        }

        .content {
          background: var(--white);
          border: 2px solid var(--border);
          border-radius: 8px;
          padding: 64px;
          box-shadow: 0 8px 32px rgba(123,53,32,0.12);
        }

        .section {
          margin-bottom: 48px;
          padding-bottom: 40px;
          border-bottom: 1px solid var(--border);
        }

        .section:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: var(--text);
          margin-bottom: 18px;
          text-transform: uppercase;
        }

        .text {
          font-size: 16px;
          line-height: 1.9;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .text strong {
          color: var(--text);
          font-weight: 700;
        }

        .callout {
          background: linear-gradient(135deg, var(--bg2) 0%, var(--bg) 100%);
          border: 2px solid var(--border);
          border-radius: 8px;
          padding: 32px;
        }

        .callout-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        .label {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.3px;
          color: var(--text);
          text-transform: uppercase;
        }

        .value {
          font-size: 16px;
          color: var(--text-muted);
          line-height: 1.8;
          word-break: break-word;
        }

        .email {
          font-weight: 700;
          color: var(--choc);
          text-decoration: none;
        }

        .email:hover {
          text-decoration: underline;
        }

        .template {
          margin-top: 18px;
          background: var(--white);
          border: 2px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .template-header {
          padding: 14px 18px;
          background: rgba(123,53,32,0.06);
          border-bottom: 1px solid var(--border);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--choc);
        }

        pre {
          margin: 0;
          padding: 18px;
          font-size: 14px;
          line-height: 1.75;
          color: var(--text);
          white-space: pre-wrap;
          word-break: break-word;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .list {
          list-style: none;
          margin-top: 10px;
        }

        .list li {
          position: relative;
          padding-left: 30px;
          margin-bottom: 12px;
          font-size: 16px;
          line-height: 1.85;
          color: var(--text-muted);
        }

        .list li::before {
          content: '▪';
          position: absolute;
          left: 0;
          color: var(--choc);
          font-size: 18px;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .page-container { padding: 100px 24px 48px; }
          .content { padding: 32px 24px; }
          .section-title { font-size: 22px; }
          .callout { padding: 22px; }
        }
      `}</style>

      <div className="page-container">
        <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>

        <div className="header">
          <h1 className="title">Data Deletion Request</h1>
          <p className="subtitle">
            If you would like to request deletion of your Carnalysys account and associated data, please follow the instructions below. We will verify your request and process it as per applicable requirements.
          </p>
        </div>

        <div className="content">
          <div className="section">
            <h2 className="section-title">How to Request Deletion</h2>
            <p className="text">
              To request deletion of your account and associated data, send an email to:
              {' '}
              <a className="email" href="mailto:support@intulet.com">support@intulet.com</a>
            </p>
            <p className="text">
              In your email, include the details listed below so we can locate and verify your account.
            </p>

            <div className="callout">
              <div className="callout-row">
                <div>
                  <div className="label">Email Address</div>
                  <div className="value"><a className="email" href="mailto:support@intulet.com">support@intulet.com</a></div>
                </div>
                <div>
                  <div className="label">Required Message</div>
                  <div className="value">Use the template below and fill in your registered details.</div>
                </div>
              </div>

              <div className="template">
                <div className="template-header">Copy / Paste Email Template</div>
                <pre>{`Subject: Data Deletion Request – Carnalysys

Hello Carnalysys Support Team,

I would like to request deletion of my Carnalysys account and all associated data.

Registered Email Address:
Registered Phone Number:
Full Name:

Reason (optional):

I confirm that I am the account owner and request that my account and associated data be deleted.

Thank you,
[Your Name]`}</pre>
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">Verification Notes</h2>
            <ul className="list">
              <li>Please send the request from your <strong>registered email address</strong> (if possible) to help us verify ownership.</li>
              <li>If we need additional information to verify the request, we may contact you using the details provided.</li>
            </ul>
          </div>

          <div className="section">
            <h2 className="section-title">What Data Will Be Deleted</h2>
            <ul className="list">
              <li>Your account profile and contact details associated with your account.</li>
              <li>Data stored in the app that is linked to your account (where applicable).</li>
              <li>Inspection-related information that is associated with your account (where applicable).</li>
            </ul>
            <p className="text">
              Certain information may be retained if required for legal, regulatory, or legitimate business purposes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataDeletionRequest;
