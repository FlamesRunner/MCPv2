type IIntervalContext = {
	intervals: NodeJS.Timeout[];
    addInterval: (interval: NodeJS.Timeout) => void;
    removeAllIntervals: () => void;
};

export default IIntervalContext;