const PeopleItemsLoading = () => {
    return (
        <div className="space-y-1 p-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                    key={i}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-2xl animate-pulse"
                >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="h-11 w-11 rounded-full bg-muted shrink-0" />
                        <div className="space-y-2 flex-1 min-w-0">
                            <div className="h-3.5 bg-muted rounded-md w-3/4 max-w-[140px]" />
                            <div className="h-2.5 bg-muted/60 rounded-md w-1/2 max-w-[80px]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PeopleItemsLoading;
