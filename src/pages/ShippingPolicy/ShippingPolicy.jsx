import React from 'react';
import './ShippingPolicy.scss';

const ShippingPolicyPage = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-page__header">
          <h1>Shipping & Return Policy</h1>
          <p>Last updated: November 15, 2025</p>
        </div>

        <div className="policy-page__content">
          <div className="policy-block">
            <h2><i className="fas fa-box-open"></i>Order Processing</h2>
            <p>
              Thank you for shopping with AlenaTrends! All orders are processed within 
              <strong> 1-2 business days</strong> (excluding weekends and holidays) 
              after receiving your order confirmation email. You will receive another 
              notification when your order has shipped.
            </p>
            <p>
              Please note that processing times may be longer during peak sale seasons or holidays.
            </p>
          </div>

          <div className="policy-block">
            <h2><i className="fas fa-shipping-fast"></i>Shipping Rates & Timelines</h2>
            <p>
              We are committed to delivering your order accurately, in good condition, and always on time. We ship to all pin codes across India.
            </p>
            <ul>
              <li>
                <strong>Free Shipping:</strong> We offer free standard shipping on all prepaid orders 
                above <strong>₹999</strong>.
              </li>
              <li>
                <strong>Standard Shipping:</strong> A flat shipping fee of <strong>₹50</strong> 
                is applicable on all orders below ₹999.
              </li>
              <li>
                <strong>Cash on Delivery (COD):</strong> A non-refundable fee of <strong>₹40</strong> 
                is applicable for all COD orders.
              </li>
            </ul>
            
            <h3>Estimated Delivery Times:</h3>
            <ul>
              <li>
                <strong>Metro Cities:</strong> 2-4 business days
              </li>
              <li>
                <strong>Tier 2/3 Cities:</strong> 4-7 business days
              </li>
              <li>
                <strong>Remote Areas (e.g., Northeast, J&K):</strong> 7-12 business days
              </li>
            </ul>
            <p>
              Business days are Monday to Saturday, excluding public holidays.
            </p>
          </div>

          <div className="policy-block">
            <h2><i className="fas fa-map-marked-alt"></i>Order Tracking</h2>
            <p>
              Once your order is shipped, you will receive a shipping confirmation email 
              containing your tracking number and a link to our tracking portal. You can use 
              this number to track your package.
            </p>
            <p>
              You can also find the tracking information in the "My Orders" section of your 
              profile on our website.
            </p>
          </div>
          
          <div className="policy-block">
            <h2><i className="fas fa-truck"></i>Our Courier Partners</h2>
            <p>
              We partner with reputable courier services to ensure your order reaches you 
              safely and on time. Our primary partners include 
              <strong> Delhivery, Blue Dart, Xpressbees, and India Post</strong>. 
              The choice of courier partner for your order is automated based on your pin code.
            </p>
          </div>

          <div className="policy-block">
            <h2><i className="fas fa-edit"></i>Address Changes & Cancellations</h2>
            <p>
              We can only update the shipping address or cancel an order 
              <strong> before it has been processed</strong> for shipping. 
              If you need to make a change, please contact our customer service team 
              at <strong>info@alenatrends.com</strong> or call us at <strong>+91 1234567890</strong> 
              within 12 hours of placing your order.
            </p>
          </div>

          {/* New Return Terms & Conditions Section */}
          <div className="policy-block policy-block--seal-pack">
            <h2><i className="fas fa-seal"></i>Return (Terms & Conditions)</h2>
            <div className="seal-pack-notice">
              <i className="fas fa-exclamation-triangle"></i>
              <p><strong>Important: Please read our seal pack policy carefully before opening your order.</strong></p>
            </div>
            
            <h3>What is Seal Pack?</h3>
            <p>
              All our products are delivered in original factory seal packs to ensure 
              <strong> 100% hygiene, authenticity, and quality assurance</strong>. 
              Each garment comes with protective tags and original packaging.
            </p>

            <h3>Seal Pack Return Policy:</h3>
            <div className="policy-grid">
              <div className="policy-item policy-item--allowed">
                <h4><i className="fas fa-check-circle"></i> Returns ALLOWED</h4>
                <ul>
                  <li>Products in <strong>original, unopened seal pack</strong></li>
                  <li>Manufacturing defects (reported within 24 hours of delivery)</li>
                  <li>Wrong item shipped (size/color mismatch)</li>
                  <li>Damaged during transit (reported within 48 hours)</li>
                  <li>All original tags and packaging intact</li>
                </ul>
              </div>
              
              <div className="policy-item policy-item--not-allowed">
                <h4><i className="fas fa-times-circle"></i> Returns NOT ALLOWED</h4>
                <ul>
                  <li><strong>Broken or removed seal tags</strong></li>
                  <li>Opened seal packs (unless for manufacturing defect check)</li>
                  <li>Products without original packaging</li>
                  <li>Items that have been worn, washed, or altered</li>
                  <li>Products with removed or damaged security tags</li>
                  <li>Change of mind after opening seal pack</li>
                </ul>
              </div>
            </div>

            <h3>Seal Tag Policy (Crucial):</h3>
            <div className="warning-box">
              <h4><i className="fas fa-ban"></i> Strict No-Return Condition</h4>
              <p>
                <strong>Clothes with broken or removed seal tags cannot be returned or exchanged under any circumstances.</strong>
              </p>
              <ul>
                <li>Seal tags are designed to be removed only after you're satisfied with the product</li>
                <li>Please try garments for fit and size without removing the seal tag</li>
                <li>Once the seal tag is broken, the product is considered used and non-returnable</li>
                <li>This policy ensures hygiene and quality standards for all customers</li>
              </ul>
            </div>

            <h3>How to Check Your Order Without Breaking Seal:</h3>
            <ul className="check-instructions">
              <li>
                <strong>Inspect Packaging:</strong> Check if the seal pack is intact and untampered
              </li>
              <li>
                <strong>Verify Contents:</strong> Ensure all ordered items are present through packaging
              </li>
              <li>
                <strong>Size & Color:</strong> Confirm size and color matches your order without opening
              </li>
              <li>
                <strong>Report Immediately:</strong> Contact us within 24 hours for any discrepancies
              </li>
            </ul>

            <div className="policy-note">
              <p>
                <i className="fas fa-info-circle"></i>
                <strong>Note:</strong> For manufacturing defect checks, you may carefully open the seal pack 
                but must preserve all tags and packaging. Report any issues within 24 hours of delivery.
              </p>
            </div>
          </div>

          <div className="policy-block">
            <h2><i className="fas fa-undo-alt"></i>Return & Exchange Process</h2>
            <p>
              We offer a <strong>7-day return policy</strong> from the date of delivery. 
              To be eligible for return:
            </p>
            <ul>
              <li>Product must be in original seal pack with all tags attached</li>
              <li>Seal tag must be intact and unbroken</li>
              <li>Original packaging and invoice must be included</li>
              <li>Product should be unused, unwashed, and in original condition</li>
            </ul>
            <p>
              Initiate returns through your account dashboard or contact our support team.
            </p>
          </div>

          <div className="policy-block">
            <h2><i className="fas fa-question-circle"></i>Need Help?</h2>
            <p>
              If you have any questions about our shipping or seal pack policy, 
              please don't hesitate to <a href="/contact">Contact Us</a>. 
              Our customer support team is available 24/7 to assist you.
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> support@alenatrends.com</p>
              <p><strong>Phone:</strong> +91 1234567890 (10 AM - 7 PM, Mon-Sat)</p>
              <p><strong>Live Chat:</strong> Available on website during business hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;