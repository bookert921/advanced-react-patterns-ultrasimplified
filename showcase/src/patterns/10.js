import React from "react";
import mojs from "mo-js";
import styles from "./index.css";

const INITIAL_STATE = {
  count: 0,
  countTotal: 267,
  isClicked: false,
};

const useClapAnimation = ({ clapEl, countEl, countTotalEl }) => {
  const animationInitialState = new mojs.Timeline();
  const [animationTimeline, setAnimationTimeline] = React.useState(
    animationInitialState
  );

  React.useEffect(() => {
    if (!clapEl || !countEl || !countTotalEl) return;
    const tlDuration = 300;
    const scaleButton = new mojs.Html({
      el: clapEl,
      duration: tlDuration,
      scale: { 1.3: 1 },
      easing: mojs.easing.ease.out,
    });

    const triangleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 95 },
      count: 5,
      angle: 30,
      children: {
        shape: "polygon",
        radius: { 6: 0 },
        stroke: "rgba(211,54,0,0.5)",
        strokeWidth: 2,
        angle: 210,
        delay: 30,
        speed: 0.2,
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        duration: tlDuration,
      },
    });

    const circleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 76 },
      angle: 25,
      duration: tlDuration,
      children: {
        shape: "circle",
        fill: "rgba(149,165,166,0.5)",
        delay: 30,
        speed: 0.2,
        radius: { 3: 0 },
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
      },
    });

    const countAnimation = new mojs.Html({
      el: countEl,
      opacity: { 0: 1 },
      y: { 0: -30 },
      duration: tlDuration,
    }).then({
      opacity: { 1: 0 },
      y: -80,
      delay: tlDuration / 2,
    });

    const countTotalAnimation = new mojs.Html({
      el: countTotalEl,
      opacity: { 0: 1 },
      delay: (3 * tlDuration) / 2,
      duration: tlDuration,
      y: { 0: -3 },
    });

    if (typeof clapEl === "string") {
      const clap = document.getElementById("clap");
      clap.style.transform = "scale(1,1)";
    } else {
      clapEl.style.transform = "scale(1,1)";
    }

    const newAnimationTimeline = animationTimeline.add([
      scaleButton,
      countTotalAnimation,
      countAnimation,
      triangleBurst,
      circleBurst,
    ]);
    // Note that it was not initially an object passed in therefore we do not need to pass an object.
    setAnimationTimeline(newAnimationTimeline);
  }, [clapEl, countEl, countTotalEl]);

  return animationTimeline;
};

const useDOMRef = () => {
  const [DOMRef, setRefsState] = React.useState({});

  const setRef = React.useCallback((node) => {
    setRefsState((prevRefsState) => ({
      ...prevRefsState,
      [node.dataset.refkey]: node,
    }));
  }, []);

  return [DOMRef, setRef];
};

const usePrevious = (value) => {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const callFnsInSequence =
  (...fns) =>
  (...args) => {
    fns.forEach((fn) => fn && fn(...args));
  };

const MAX_CLAP_COUNT = 50;

const internalReducer = (state, action) => {
  switch (action.type) {
    case "clap":
      return {
        isClicked: true,
        count: Math.min(state.count + 1, MAX_CLAP_COUNT),
        countTotal:
          state.count < MAX_CLAP_COUNT
            ? state.countTotal + 1
            : state.countTotal,
      };
    case "reset":
      return action.payload;
    default:
      break;
  }
};

const useClapState = (
  initialState = INITIAL_STATE,
  reducer = internalReducer
) => {
  const [clapState, dispatch] = React.useReducer(reducer, initialState);
  const { count } = clapState;
  const userInitialState = React.useRef(initialState);

  const updateClapState = () => {
    dispatch({ type: "clap" });
  };

  // Glorified counter
  const resetRef = React.useRef(0);
  const prevCount = usePrevious(count);
  const reset = React.useCallback(() => {
    if (prevCount !== count) {
      dispatch({ type: "reset", payload: userInitialState.current });
      resetRef.current++;
    }
  }, [count, prevCount, dispatch]);

  const getTogglerProps = ({ onClick, ...otherProps } = {}) => ({
    onClick: callFnsInSequence(updateClapState, onClick),
    "aria-pressed": clapState.isClicked,
    ...otherProps,
  });

  const getCounterProps = ({ ...otherProps }) => ({
    count,
    "aria-valuemax": MAX_CLAP_COUNT,
    "aria-valuemin": 0,
    "aria-valuenow": count,
    ...otherProps,
  });

  return {
    clapState,
    updateClapState,
    getTogglerProps,
    getCounterProps,
    reset,
    resetDep: resetRef.current,
  };
};

useClapState.reducer = internalReducer;
useClapState.types = {
  clap: "clap",
  reset: "reset",
};

const useEffectAfterMount = (cb, deps) => {
  const componentJustMounted = React.useRef(true);
  React.useEffect(() => {
    if (!componentJustMounted.current) {
      return cb();
    } else {
      componentJustMounted.current = false;
    }
    // eslint-disable-next line react-hooks/exaustive-deps
  }, deps);
};

const MediumClapContainer = ({
  children,
  handleClick,
  setRef,
  className,
  style: userStyles = {},
  ...restProps
}) => {
  const classNames = [styles.clap, className].join(" ").trim();

  return (
    <button
      ref={setRef}
      style={userStyles}
      className={classNames}
      onClick={handleClick}
      {...restProps}
    >
      {children}
    </button>
  );
};

const ClapIcon = ({ isClicked, className, style: userStyles = {} }) => {
  const classNames = [styles.icon, isClicked ? styles.checked : "", className]
    .join(" ")
    .trim();

  return (
    <span>
      <svg
        id="clapIcon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-549 338 100.1 125"
        className={classNames}
        style={userStyles}
      >
        <path d="M-471.2 366.8c1.2 1.1 1.9 2.6 2.3 4.1.4-.3.8-.5 1.2-.7 1-1.9.7-4.3-1-5.9-2-1.9-5.2-1.9-7.2.1l-.2.2c1.8.1 3.6.9 4.9 2.2zm-28.8 14c.4.9.7 1.9.8 3.1l16.5-16.9c.6-.6 1.4-1.1 2.1-1.5 1-1.9.7-4.4-.9-6-2-1.9-5.2-1.9-7.2.1l-15.5 15.9c2.3 2.2 3.1 3 4.2 5.3zm-38.9 39.7c-.1-8.9 3.2-17.2 9.4-23.6l18.6-19c.7-2 .5-4.1-.1-5.3-.8-1.8-1.3-2.3-3.6-4.5l-20.9 21.4c-10.6 10.8-11.2 27.6-2.3 39.3-.6-2.6-1-5.4-1.1-8.3z" />
        <path d="M-527.2 399.1l20.9-21.4c2.2 2.2 2.7 2.6 3.5 4.5.8 1.8 1 5.4-1.6 8l-11.8 12.2c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l34-35c1.9-2 5.2-2.1 7.2-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l28.5-29.3c2-2 5.2-2 7.1-.1 2 1.9 2 5.1.1 7.1l-28.5 29.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.4 1.7 0l24.7-25.3c1.9-2 5.1-2.1 7.1-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l14.6-15c2-2 5.2-2 7.2-.1 2 2 2.1 5.2.1 7.2l-27.6 28.4c-11.6 11.9-30.6 12.2-42.5.6-12-11.7-12.2-30.8-.6-42.7m18.1-48.4l-.7 4.9-2.2-4.4m7.6.9l-3.7 3.4 1.2-4.8m5.5 4.7l-4.8 1.6 3.1-3.9" />
      </svg>
    </span>
  );
};

const ClapCount = ({
  count,
  setRef,
  style: userStyles = {},
  className,
  ...restProps
}) => {
  const classNames = [styles.count, className].join(" ").trim();
  return (
    <span ref={setRef} style={userStyles} className={classNames} {...restProps}>
      + {count}
    </span>
  );
};

const ClapTotal = ({
  countTotal,
  setRef,
  style: userStyles = {},
  className,
  ...restProps
}) => {
  const classNames = [styles.total, className].join(" ").trim();
  return (
    <span style={userStyles} ref={setRef} className={classNames} {...restProps}>
      {countTotal}
    </span>
  );
};

const userInitialState = {
  count: 20,
  countTotal: 1000,
  isClicked: true,
};

const Usage = () => {
  const [timesClapped, setTimesClapped] = React.useState(1);
  const isClappedTooMuch = timesClapped >= 7;

  const reducer = (state, action) => {
    if (action.type === useClapState.types.clap && isClappedTooMuch) {
      return state;
    } else {
      return useClapState.reducer(state, action);
    }
  };

  const { clapState, getTogglerProps, getCounterProps, reset, resetDep } =
    useClapState(userInitialState, reducer);
  const { count, countTotal, isClicked } = clapState;
  const [{ clapRef, countRef, countTotalRef }, setRef] = useDOMRef();

  const animationTimeline = useClapAnimation({
    clapEl: clapRef,
    countEl: countRef,
    countTotalEl: countTotalRef,
  });

  useEffectAfterMount(() => {
    animationTimeline.replay();
  }, [count]);

  const [uploadingReset, setUpload] = React.useState(false);
  useEffectAfterMount(() => {
    setUpload(true);

    const id = setTimeout(() => {
      setUpload(false);
    }, 3000);

    return () => clearTimeout(id);
  }, [resetDep]);

  const handleClick = () => {
    setTimesClapped((t) => t + 1);
  };

  return (
    <div>
      <MediumClapContainer
        setRef={setRef}
        data-refkey="clapRef"
        {...getTogglerProps({ onClick: handleClick, "aria-pressed": false })}
      >
        <ClapIcon isClicked={isClicked} />
        <ClapCount
          {...getCounterProps()}
          setRef={setRef}
          data-refkey="countRef"
        />
        <ClapTotal
          countTotal={countTotal}
          setRef={setRef}
          data-refkey="countTotalRef"
        />
      </MediumClapContainer>
      <section>
        <button onClick={reset} className={styles.resetBtn}>
          Reset
        </button>
        <pre className={styles.resetMsg}>
          {JSON.stringify({ timesClapped, count, countTotal })}
        </pre>
        <pre className={styles.resetMsg}>
          {uploadingReset ? `uploading reset ${resetDep} ...` : ""}
        </pre>
        <pre style={{ color: "red" }}>
          {isClappedTooMuch
            ? `You have clapped too much. Don't be so generous!`
            : ""}
        </pre>
      </section>
    </div>
  );
};

export default Usage;
