import * as React from "react"

const LoadingAnimation = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        margin: "auto",
        background: "0 0",
      }}
      width={props.width}
      height={props.height}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      display="block"
    >
      <circle cx={84} cy={50} r={10} fill="#b5b5b5">
        <animate
          attributeName="r"
          repeatCount="indefinite"
          dur="0.2840909090909091s"
          calcMode="spline"
          keyTimes="0;1"
          values="10;0"
          keySplines="0 0.5 0.5 1"
          begin="0s"
        />
        <animate
          attributeName="fill"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="discrete"
          keyTimes="0;0.25;0.5;0.75;1"
          values="#b5b5b5;#b5b5b5;#b5b5b5;#b5b5b5;#b5b5b5"
          begin="0s"
        />
      </circle>
      <circle cx={16} cy={50} r={10} fill="#b5b5b5">
        <animate
          attributeName="r"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          values="0;0;10;10;10"
          keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
          begin="0s"
        />
        <animate
          attributeName="cx"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          values="16;16;16;50;84"
          keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
          begin="0s"
        />
      </circle>
      <circle cx={50} cy={50} r={10} fill="#b5b5b5">
        <animate
          attributeName="r"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          values="0;0;10;10;10"
          keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
          begin="-0.2840909090909091s"
        />
        <animate
          attributeName="cx"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          values="16;16;16;50;84"
          keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
          begin="-0.2840909090909091s"
        />
      </circle>
      <circle cx={84} cy={50} r={10} fill="#b5b5b5">
        <animate
          attributeName="r"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          values="0;0;10;10;10"
          keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
          begin="-0.5681818181818182s"
        />
        <animate
          attributeName="cx"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          values="16;16;16;50;84"
          keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
          begin="-0.5681818181818182s"
        />
      </circle>
      <circle cx={16} cy={50} r={10} fill="#b5b5b5">
        <animate
          attributeName="r"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          values="0;0;10;10;10"
          keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
          begin="-0.8522727272727273s"
        />
        <animate
          attributeName="cx"
          repeatCount="indefinite"
          dur="1.1363636363636365s"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          values="16;16;16;50;84"
          keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
          begin="-0.8522727272727273s"
        />
      </circle>
    </svg>
  )
}

export {LoadingAnimation}