const UserItemsLoading = () => {
    return (
        <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                    key={i}
                    className="flex items-center w-full px-3 py-2.5 rounded-xl space-x-3 animate-pulse"
                >
                    <div className="h-12 w-12 rounded-full bg-muted shrink-0" />

                    <div className="flex flex-col flex-1 min-w-0 h-14 justify-center border-b border-border/60 pb-1 space-y-2">
                        <div className="flex flex-row w-full justify-between items-baseline">
                            <div className="h-3.5 bg-muted rounded-md w-1/2 max-w-[120px]" />
                            <div className="h-2.5 bg-muted/60 rounded-md w-10" />
                        </div>
                        <div className="h-2.5 bg-muted/60 rounded-md w-3/4 max-w-[180px]" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UserItemsLoading;
