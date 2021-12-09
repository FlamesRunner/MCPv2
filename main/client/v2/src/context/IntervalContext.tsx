import React from "react";
import IIntervalContext from "../types/IntervalTypes";

const IntervalContext = React.createContext<IIntervalContext>({
	intervals: [],
    addInterval: (interval) => {},
    removeAllIntervals: () => {}
});

export default IntervalContext;