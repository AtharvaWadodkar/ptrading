import React from "react";
import "./RiskModal.css";

function RiskModal({ onAcknowledge }) {
  return (
    <div className="risk-modal-overlay">
      <div className="risk-modal">
        <h2>⚠️ Risk Disclosures on Derivatives</h2>
        <ul>
          <li>9 out of 10 individual traders in equity Futures and Options Segment incurred net losses.</li>
          <li>On average, loss makers registered net trading loss close to ₹50,000.</li>
          <li>They also spent an additional 28% of losses as transaction costs.</li>
          <li>Even profitable traders incurred 15% to 50% of profits as transaction costs.</li>
        </ul>

        <div className="disclaimer-confirmation">
          <input type="checkbox" id="agree" required />
          <label htmlFor="agree">
            I have read and understood the above-stated Risk Disclosure.
          </label>
        </div>

        <button className="proceed-btn" onClick={onAcknowledge}>
          I Understand the Risks, Proceed
        </button>
      </div>
    </div>
  );
}

export default RiskModal;
