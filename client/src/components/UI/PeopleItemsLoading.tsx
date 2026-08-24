const PeopleItemsLoading = () => {
    return (
        <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                    key={i}
                    className="flex items-center w-full px-3 py-2.5 rounded-2xl gap-3 animate-pulse border border-transparent"
                >
                    <div className="h-12 w-12 rounded-full bg-muted/80 shrink-0" />

                    <div className="flex flex-col flex-1 min-w-0 justify-center space-y-2 py-1">
                        <div className="flex items-center justify-between">
                            <div className="h-3.5 bg-muted rounded-md w-1/3 max-w-[130px]" />
                            <div className="h-2.5 bg-muted/60 rounded-md w-10" />
                        </div>
                        <div className="h-2.5 bg-muted/50 rounded-md w-2/3 max-w-[190px]" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PeopleItemsLoading;
