import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Loader from "../shared/components/Loader";

const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const GOOGLE_BUTTON_SIZE = 40;

export default function AuthLayout() {
  const { user, googleLogin } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);
  const googleLoginRef = useRef(googleLogin);

  const buttonHostRef = useRef(null);
  const initializedRef = useRef(false);

  const [googleError, setGoogleError] = useState("");
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const effectiveGoogleError =
    googleError || (!clientId ? "Google login is currently unavailable." : "");

  useLayoutEffect(() => {
    locationRef.current = location;
    navigateRef.current = navigate;
    googleLoginRef.current = googleLogin;
  }, [location, navigate, googleLogin]);

  // Keep the Google-rendered button in one permanent DOM host.
  useEffect(() => {
    if (!clientId) return undefined;

    let cancelled = false;
    let script = null;
    let createdScript = false;

    const buttonHost = buttonHostRef.current;

    if (!buttonHost) return undefined;

    const handleCredential = async (response) => {
      if (!response?.credential) {
        setGoogleError(
          "Google did not return a valid credential. Please try again.",
        );
        return;
      }

      setGoogleSubmitting(true);
      setGoogleError("");

      try {
        await googleLoginRef.current(response.credential);

        const currentLocation = locationRef.current;
        const destination =
          currentLocation.pathname === "/login"
            ? (currentLocation.state?.from ?? "/dashboard")
            : "/dashboard";

        navigateRef.current(destination, { replace: true });
      } catch (error) {
        setGoogleError(
          error?.message || "Google sign-in failed. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setGoogleSubmitting(false);
        }
      }
    };

    const initializeGoogle = () => {
      if (cancelled || initializedRef.current || !window.google?.accounts?.id) {
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(buttonHost, {
          type: "icon",
          theme: "filled_black",
          size: "large",
          shape: "circle",
        });

        initializedRef.current = true;
        setGoogleReady(true);
        setGoogleError("");
      } catch (error) {
        console.error("Google sign-in initialization failed:", error);
        setGoogleError("Unable to initialize Google sign-in.");
      }
    };

    const onScriptLoad = () => {
      if (script) script.dataset.loaded = "true";
      initializeGoogle();
    };

    const onScriptError = () => {
      if (!cancelled) {
        setGoogleError("Unable to load Google sign-in. Please try again.");
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      script = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);

      if (!script) {
        script = document.createElement("script");
        script.src = GOOGLE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        createdScript = true;
      }

      script.addEventListener("load", onScriptLoad);
      script.addEventListener("error", onScriptError);

      if (createdScript) {
        document.head.appendChild(script);
      } else if (script.dataset.loaded === "true") {
        initializeGoogle();
      }
    }

    return () => {
      cancelled = true;

      script?.removeEventListener("load", onScriptLoad);
      script?.removeEventListener("error", onScriptError);

      // Clear Google's iframe contents, but leave the React-owned host in place.
      buttonHost.replaceChildren();
      initializedRef.current = false;
    };
  }, [clientId]);

  // Move only the fixed host's coordinates. The Google iframe itself never moves
  // between DOM parents, so it cannot slide in from the side on route changes.
  useLayoutEffect(() => {
    const host = buttonHostRef.current;

    if (!host) return undefined;

    let animationFrame = 0;
    let observedPlaceholder = null;

    const hideHost = () => {
      host.style.visibility = "hidden";
      host.style.pointerEvents = "none";
    };

    const positionHost = () => {
      const placeholder = document.getElementById("google-signin-button");

      if (observedPlaceholder && observedPlaceholder !== placeholder) {
        resizeObserver.unobserve(observedPlaceholder);
        observedPlaceholder = null;
      }

      if (!placeholder || !googleReady || user !== null) {
        hideHost();
        return;
      }

      if (observedPlaceholder !== placeholder) {
        observedPlaceholder = placeholder;
        resizeObserver.observe(placeholder);
      }

      const rect = placeholder.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        hideHost();
        return;
      }

      host.style.left = `${
        rect.left + (rect.width - GOOGLE_BUTTON_SIZE) / 2
      }px`;
      host.style.top = `${rect.top + (rect.height - GOOGLE_BUTTON_SIZE) / 2}px`;
      host.style.visibility = "visible";
      host.style.pointerEvents = googleSubmitting ? "none" : "auto";
    };

    const schedulePosition = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(positionHost);
    };

    const resizeObserver = new ResizeObserver(schedulePosition);

    hideHost();
    // Calculate the correct position immediately before the browser paints.
    positionHost();

    window.addEventListener("resize", schedulePosition);
    window.addEventListener("scroll", schedulePosition, true);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", schedulePosition);
      window.removeEventListener("scroll", schedulePosition, true);
    };
  }, [location.pathname, googleReady, googleSubmitting, user]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {user === undefined ? (
        <Loader label="Checking your session…" />
      ) : (
        <Outlet
          context={{
            googleError: effectiveGoogleError,
            googleSubmitting,
            googleAvailable: googleReady,
          }}
        />
      )}

      <div
        ref={buttonHostRef}
        aria-label="Google sign-in"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: `${GOOGLE_BUTTON_SIZE}px`,
          height: `${GOOGLE_BUTTON_SIZE}px`,
          zIndex: 1000,
          overflow: "hidden",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
