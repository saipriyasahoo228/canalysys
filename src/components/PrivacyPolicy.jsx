import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
        
        .privacy-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 120px 48px 64px;
        }
        
        .privacy-header {
          text-align: center;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 2px solid var(--border);
        }
        
        .privacy-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(48px, 6vw, 72px);
          letter-spacing: 3px;
          color: var(--choc);
          margin-bottom: 16px;
        }
        
        .privacy-meta {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 24px;
          font-size: 13px;
          color: var(--text-muted);
        }
        
        .privacy-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .privacy-meta-item strong {
          color: var(--choc);
          font-weight: 600;
        }
        
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: 2px;
          color: var(--text);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 32px;
          text-decoration: none;
        }
        
        .back-btn:hover {
          border-color: var(--choc);
          color: var(--choc);
          transform: translateY(-2px);
        }
        
        .privacy-content {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 48px;
          box-shadow: var(--shadow);
        }
        
        .privacy-section {
          margin-bottom: 40px;
        }
        
        .privacy-section:last-child {
          margin-bottom: 0;
        }
        
        .section-number {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          color: var(--choc-pale);
          margin-bottom: 8px;
        }
        
        .section-heading {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--text);
          margin-bottom: 16px;
        }
        
        .sub-section {
          margin: 24px 0 16px;
          padding-left: 20px;
          border-left: 3px solid var(--border);
        }
        
        .sub-heading {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--choc);
          margin-bottom: 12px;
        }
        
        .privacy-text {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        
        .privacy-text strong {
          color: var(--text);
          font-weight: 600;
        }
        
        .privacy-list {
          list-style: none;
          margin: 16px 0;
          padding-left: 0;
        }
        
        .privacy-list li {
          position: relative;
          padding-left: 24px;
          margin-bottom: 10px;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-muted);
        }
        
        .privacy-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--choc);
          font-weight: bold;
        }
        
        .permission-item {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 24px;
          margin-bottom: 16px;
        }
        
        .permission-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--choc);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .permission-title::before {
          content: '🔒';
          font-size: 20px;
        }
        
        .permission-detail {
          margin: 12px 0;
        }
        
        .permission-label {
          font-weight: 600;
          color: var(--text);
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .effective-date {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          font-size: 14px;
          color: var(--text-muted);
          text-align: center;
        }
        
        .effective-date strong {
          color: var(--choc);
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .privacy-container {
            padding: 100px 24px 48px;
          }
          
          .privacy-content {
            padding: 32px 24px;
          }
          
          .privacy-title {
            font-size: 36px;
          }
          
          .privacy-meta {
            flex-direction: column;
            gap: 12px;
          }
          
          .section-heading {
            font-size: 20px;
          }
          
          .sub-heading {
            font-size: 16px;
          }
        }
      `}</style>
      
      <div className="privacy-container">
        <button 
          className="back-btn" 
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>
        
        <div className="privacy-header">
          <h1 className="privacy-title">Privacy Policy</h1>
          <div className="privacy-meta">
            <div className="privacy-meta-item">
              <strong>Last Updated:</strong> April 29, 2026
            </div>
            <div className="privacy-meta-item">
              <strong>App Version:</strong> 1.0.0
            </div>
            <div className="privacy-meta-item">
              <strong>Company:</strong> Carnalysys
            </div>
          </div>
        </div>
        
        <div className="privacy-content">
          <div className="privacy-section">
            <div className="section-number">1</div>
            <h2 className="section-heading">Introduction</h2>
            <p className="privacy-text">
              Carnalysys ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect your information when you use our car inspection mobile application ("App").
            </p>
          </div>
          
          <div className="privacy-section">
            <div className="section-number">2</div>
            <h2 className="section-heading">Information We Collect</h2>
            
            <div className="sub-section">
              <h3 className="sub-heading">2.1 Personal Information</h3>
              <ul className="privacy-list">
                <li><strong>Name and Contact Details:</strong> When you create an account</li>
                <li><strong>Email Address:</strong> For account verification and communication</li>
                <li><strong>Phone Number:</strong> For appointment confirmations and updates</li>
                <li><strong>Address/Location:</strong> For service scheduling and inspector assignment</li>
              </ul>
            </div>
            
            <div className="sub-section">
              <h3 className="sub-heading">2.2 Vehicle Information</h3>
              <ul className="privacy-list">
                <li><strong>Vehicle Details:</strong> Make, model, year, VIN number</li>
                <li><strong>Vehicle Images:</strong> Photos taken during inspection process</li>
                <li><strong>Registration Documents:</strong> When provided for verification</li>
              </ul>
            </div>
            
            <div className="sub-section">
              <h3 className="sub-heading">2.3 Technical Information</h3>
              <ul className="privacy-list">
                <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
                <li><strong>Usage Data:</strong> How you interact with the App, features used, session duration</li>
                <li><strong>Location Data:</strong> When you enable location services for address autofill</li>
              </ul>
            </div>
            
            <div className="sub-section">
              <h3 className="sub-heading">2.4 Payment Information</h3>
              <ul className="privacy-list">
                <li><strong>Payment Details:</strong> Processed through secure third-party payment gateways</li>
                <li><strong>Transaction History:</strong> Records of payments for inspection services</li>
              </ul>
            </div>
          </div>
          
          <div className="privacy-section">
            <div className="section-number">3</div>
            <h2 className="section-heading">How We Use Your Information</h2>
            <p className="privacy-text">We use your information to:</p>
            
            <div className="sub-section">
              <h3 className="sub-heading">3.1 Service Provision</h3>
              <ul className="privacy-list">
                <li>Schedule and manage car inspection appointments</li>
                <li>Connect you with qualified inspection professionals</li>
                <li>Generate detailed inspection reports</li>
                <li>Process payments for services rendered</li>
              </ul>
            </div>
            
            <div className="sub-section">
              <h3 className="sub-heading">3.2 Communication</h3>
              <ul className="privacy-list">
                <li>Send appointment confirmations and reminders</li>
                <li>Provide service updates and notifications</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Send important app updates</li>
              </ul>
            </div>
            
            <div className="sub-section">
              <h3 className="sub-heading">3.3 App Improvement</h3>
              <ul className="privacy-list">
                <li>Analyze usage patterns to improve our services</li>
                <li>Fix technical issues and enhance user experience</li>
                <li>Develop new features based on user feedback</li>
              </ul>
            </div>
            
            <div className="sub-section">
              <h3 className="sub-heading">3.4 Legal Compliance</h3>
              <ul className="privacy-list">
                <li>Comply with applicable laws and regulations</li>
                <li>Protect our rights, property, and safety</li>
                <li>Prevent fraudulent activities</li>
              </ul>
            </div>
          </div>
          
          <div className="privacy-section">
            <div className="section-number">4</div>
            <h2 className="section-heading">Information Sharing</h2>
            <p className="privacy-text">We do not sell your personal information. We may share your information only in the following circumstances:</p>
            
            <div className="sub-section">
              <h3 className="sub-heading">4.1 Service Providers</h3>
              <ul className="privacy-list">
                <li><strong>Payment Processors:</strong> For secure payment processing</li>
                <li><strong>Cloud Storage Providers:</strong> For data backup and storage</li>
                <li><strong>Analytics Services:</strong> For app performance monitoring</li>
                <li><strong>Communication Services:</strong> For sending notifications</li>
              </ul>
            </div>
            
            <div className="sub-section">
              <h3 className="sub-heading">4.2 Inspection Professionals</h3>
              <ul className="privacy-list">
                <li>Assigned inspectors receive relevant vehicle and appointment details</li>
                <li>Location information for service delivery</li>
                <li>Contact information for coordination</li>
              </ul>
            </div>
            
            <div className="sub-section">
              <h3 className="sub-heading">4.3 Legal Requirements</h3>
              <ul className="privacy-list">
                <li>When required by law, court order, or government regulation</li>
                <li>To protect our rights, property, or safety</li>
              </ul>
            </div>
          </div>
          
          <div className="privacy-section">
            <div className="section-number">5</div>
            <h2 className="section-heading">Data Security</h2>
            <p className="privacy-text">We implement industry-standard security measures:</p>
            <ul className="privacy-list">
              <li><strong>Encryption:</strong> Data is encrypted both in transit and at rest</li>
              <li><strong>Access Controls:</strong> Limited access to personal information</li>
              <li><strong>Regular Audits:</strong> Periodic security assessments</li>
              <li><strong>Secure Servers:</strong> Hosting with reputable cloud providers</li>
            </ul>
          </div>
          
          <div className="privacy-section">
            <div className="section-number">6</div>
            <h2 className="section-heading">Your Rights</h2>
            <p className="privacy-text">You have the right to:</p>
            <ul className="privacy-list">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Opt-out:</strong> Unsubscribe from communications</li>
            </ul>
          </div>
          
          <div className="privacy-section">
            <div className="section-number">7</div>
            <h2 className="section-heading">Data Retention</h2>
            <p className="privacy-text">We retain your information for as long as necessary to:</p>
            <ul className="privacy-list">
              <li>Provide our services</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce our agreements</li>
            </ul>
          </div>
          
          <div className="privacy-section">
            <div className="section-number">8</div>
            <h2 className="section-heading">Specific Permissions Explained</h2>
            
            <div className="permission-item">
              <h3 className="permission-title">Camera Access</h3>
              <div className="permission-detail">
                <div className="permission-label">Purpose:</div>
                <p className="privacy-text">Capture vehicle images for inspection reports</p>
              </div>
              <div className="permission-detail">
                <div className="permission-label">Usage:</div>
                <p className="privacy-text">Only when you actively take photos for inspections</p>
              </div>
              <div className="permission-detail">
                <div className="permission-label">Storage:</div>
                <p className="privacy-text">Images are stored securely and used solely for inspection purposes</p>
              </div>
            </div>
            
            <div className="permission-item">
              <h3 className="permission-title">Photo Library Access</h3>
              <div className="permission-detail">
                <div className="permission-label">Purpose:</div>
                <p className="privacy-text">Select existing vehicle images for reports</p>
              </div>
              <div className="permission-detail">
                <div className="permission-label">Usage:</div>
                <p className="privacy-text">Only when you choose to upload images</p>
              </div>
              <div className="permission-detail">
                <div className="permission-label">Storage:</div>
                <p className="privacy-text">Selected images are processed for inspection documentation</p>
              </div>
            </div>
            
            <div className="permission-item">
              <h3 className="permission-title">Location Access</h3>
              <div className="permission-detail">
                <div className="permission-label">Purpose:</div>
                <p className="privacy-text">Autofill addresses for inspection scheduling</p>
              </div>
              <div className="permission-detail">
                <div className="permission-label">Usage:</div>
                <p className="privacy-text">Only when you use location-based features</p>
              </div>
              <div className="permission-detail">
                <div className="permission-label">Control:</div>
                <p className="privacy-text">You can deny access and manually enter addresses</p>
              </div>
            </div>
            
            <div className="permission-item">
              <h3 className="permission-title">Storage Access</h3>
              <div className="permission-detail">
                <div className="permission-label">Purpose:</div>
                <p className="privacy-text">Save inspection reports and documents</p>
              </div>
              <div className="permission-detail">
                <div className="permission-label">Usage:</div>
                <p className="privacy-text">Only when you download or save content</p>
              </div>
              <div className="permission-detail">
                <div className="permission-label">Security:</div>
                <p className="privacy-text">All saved files are encrypted on your device</p>
              </div>
            </div>
          </div>
          
          <div className="effective-date">
            <p className="privacy-text">
              By using Carnalysys, you acknowledge that you have read and agree to this Privacy Policy.
            </p>
            <p className="privacy-text">
              <strong>Effective Date:</strong> April 29, 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
