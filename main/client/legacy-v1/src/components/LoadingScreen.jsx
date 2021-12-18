import React from "react";
import LoadingGif from "../images/loading.gif"

export default function LoadingScreen() {
  return (
    <div className="z-50 w-full h-full overflow-y-hidden overflow-x-hidden">
      <div className="text-black text-center absolute top-1/2 left-1/2 transform -translate-x-1/2">
        <h3 className="text-2xl mt-4">
            <img src={LoadingGif} alt="Loading..." />
        </h3>
      </div>
    </div>
  );
}
