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
      <div className="auth-brand">
        <span className="brand-icon">₹</span>
        <span>SplitTab</span>
      </div>

      <aside className="auth-features">
        <div className="feature-intro">
          <span className="feature-eyebrow">
            {isLogin
              ? "SHARED EXPENSES, SIMPLIFIED"
              : "GET STARTED WITH SPLITTAB"}
          </span>

          <h1>
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
              <div className="feature-icon">{feature.icon}</div>

              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <aside className="auth-preview">
        <div className="preview-back preview-back-one" />
        <div className="preview-back preview-back-two" />

        <div className="preview-card" key={activeSlide}>
          <div className="preview-header">
            <div className="preview-group-icon">
              {activeSlide === 0 ? "♧" : activeSlide === 1 ? "▤" : "↗"}
            </div>

            <div>
              <h3>{slide.title}</h3>
              <p>{slide.subtitle}</p>
            </div>

            <span className="preview-menu">⋮</span>
          </div>

          <div className="preview-divider" />

          <div className="expense-list">
            {slide.rows.map(([icon, name, value]) => (
              <div className="expense-item" key={name}>
                <span className="expense-icon">{icon}</span>
                <span className="expense-name">{name}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="preview-divider" />

          <div className="preview-split">
            <span>{slide.footerLabel}</span>
            <strong>{slide.footerValue}</strong>
          </div>
        </div>

        <div className="preview-dots">
          {slides.map((item, index) => (
            <button
              type="button"
              key={item.type}
              className={activeSlide === index ? "active" : ""}
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