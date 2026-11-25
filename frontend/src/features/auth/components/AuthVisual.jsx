import { useEffect, useState } from "react";

const slides = [
  {
    type: "GROUP",
    title: "Goa Trip",
    subtitle: "4 members",
    rows: [
      ["♧", "Alex", "Member"],
      ["♧", "Prakhar", "Admin"],
      ["♧", "Rahul", "Member"],
    ],
    footerLabel: "Group status",
    footerValue: "Active",
  },
  {
    type: "EXPENSES",
    title: "Recent expenses",
    subtitle: "Goa Trip",
    rows: [
      ["▣", "Hotel", "₹3,000"],
      ["♨", "Dinner", "₹1,800"],
      ["▰", "Taxi", "₹600"],
    ],
    footerLabel: "Split equally (4)",
    footerValue: "₹1,350 each",
  },
  {
    type: "SETTLEMENTS",
    title: "Group balances",
    subtitle: "Goa Trip",
    rows: [
      ["↗", "Alex owes you", "₹800"],
      ["↙", "You owe Rahul", "₹500"],
      ["✓", "Dinner settled", "Done"],
    ],
    footerLabel: "Your net balance",
    footerValue: "+₹300",
  },
];

const features = [
  {
    icon: "♧",
    title: "Groups",
    description: "Create and manage groups.",
  },
  {
    icon: "▤",
    title: "Expenses",
    description: "Add and split expenses.",
  },
  {
    icon: "↗",
    title: "Settlements",
    description: "Know who owes whom.",
  },
];

export default function AuthVisual({ variant = "login" }) {
  const [activeSlide, setActiveSlide] = useState(1);

  const isLogin = variant === "login";

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const slide = slides[activeSlide];

  return (
    <>
      {/* Brand */}
      <div className="auth-brand cursor-default select-none">
        <span className="brand-icon">₹</span>
        <span>SplitTab</span>
      </div>

      {/* Features */}
      <aside className="auth-features">
        <div className="feature-intro">
          <span className="feature-eyebrow cursor-default select-none">
            {isLogin
              ? "SHARED EXPENSES, SIMPLIFIED"
              : "GET STARTED WITH SPLITTAB"}
          </span>

          <h1 className="cursor-default select-none">
            {isLogin ? (
              <>
                Manage groups,
                <br />
                split expenses,
                <br />
                settle easily.
              </>
            ) : (
              <>
                Create groups,
                <br />
                share expenses,
                <br />
                stay in sync.
              </>
            )}
          </h1>
        </div>

        <div className="feature-list">
          {features.map((feature) => (
            <div className="feature-item" key={feature.title}>
              <div className="feature-icon cursor-default select-none">
                {feature.icon}
              </div>

              <div>
                <h3 className="cursor-default select-none">{feature.title}</h3>

                <p className="cursor-default select-none">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Preview */}
      <aside className="auth-preview">
        <div className="preview-back preview-back-one" />
        <div className="preview-back preview-back-two" />

        <div className="preview-card" key={activeSlide}>
          <div className="preview-header">
            <div className="preview-group-icon cursor-default select-none">
              {activeSlide === 0 ? "♧" : activeSlide === 1 ? "▤" : "↗"}
            </div>

            <div>
              <h3 className="cursor-default select-none">{slide.title}</h3>

              <p className="cursor-default select-none">{slide.subtitle}</p>
            </div>

            <span className="preview-menu cursor-default select-none">⋮</span>
          </div>

          <div className="preview-divider" />

          <div className="expense-list">
            {slide.rows.map(([icon, name, value]) => (
              <div className="expense-item" key={name}>
                <span className="expense-icon cursor-default select-none">
                  {icon}
                </span>

                <span className="expense-name cursor-default select-none">
                  {name}
                </span>

                <strong className="cursor-default select-none">{value}</strong>
              </div>
            ))}
          </div>

          <div className="preview-divider" />

          <div className="preview-split">
            <span className="cursor-default select-none">
              {slide.footerLabel}
            </span>

            <strong className="cursor-default select-none">
              {slide.footerValue}
            </strong>
          </div>
        </div>

        {/* Slide Controls */}
        <div className="preview-dots">
          {slides.map((item, index) => (
            <button
              type="button"
              key={item.type}
              className={`cursor-pointer ${
                activeSlide === index ? "active" : ""
              }`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Show ${item.type.toLowerCase()} preview`}
              aria-pressed={activeSlide === index}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
