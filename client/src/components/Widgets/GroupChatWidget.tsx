import { useContext, useEffect, useState } from "react";
import ReactSelect, { MultiValue, OptionProps } from "react-select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { fetchPeople } from "../../api/auth";
import { createGroupConversation } from "../../api/conversation";
import { queryClient } from "../../api/auth";
import { Participant } from "../../types";

interface SelectOption {
    label: string;
    value: string;
    image: string;
    id: string;
}

const CustomOption: React.FC<OptionProps<SelectOption, true>> = ({ label, data, innerProps }) => (
    <div {...innerProps} className="flex flex-row items-center space-x-3 my-2.5 ml-2 cursor-pointer">
        <img src={data.image} alt="" className="h-10 w-10 rounded-full object-contain" />
        <p className="text-base font-semibold">{label}</p>
    </div>
);

const GroupChatWidget = () => {

    const { setGroupChatWidget } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [groupName, setGroupName] = useState<string>("");
    const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>([]);

    const { data: people, isSuccess } = useQuery<Participant[]>({
        queryKey: ['people'],
        queryFn: () => {
            if (!user?._id) return [];
            return fetchPeople(user._id);
        },
        enabled: Boolean(user?._id),
    });

    const { mutate, status } = useMutation({
        mutationFn: () => {
            if (!user?._id) throw new Error("User not authenticated");
            return createGroupConversation(selectedOptions, groupName, user._id);
        },
        onSuccess: async() => {
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            setGroupChatWidget(false);
            toast.success("New Group created");
        }
    });

    useEffect(() => {
        if (isSuccess && people) {
            const filterOptions: SelectOption[] = people.map((person: Participant) => ({
                label: person.fullName,
                value: person._id,
                image: person.picture,
                id: person._id,
            }));
            setOptions(filterOptions);
        }
    }, [isSuccess, people]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (status === 'pending') return;

        if (groupName.trim().length === 0) {
            toast.error('Enter a group name');
            return;
        } else if (selectedOptions.length < 2) {
            toast.error('Add at least 2 Members');
            return;
        }

        mutate();
    };

    const handleGroupNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGroupName(event.target.value);
    };

    const handleSelectChange = (selected: MultiValue<SelectOption>) => {
        const updatedOptions: SelectOption[] = (selected as readonly SelectOption[]).map((option: SelectOption) => {
            const labelParts = option.label ? option.label.split(' ') : [];
            const firstName = labelParts.length > 0 ? labelParts[0] : null;

            return {
                ...option,
                label: firstName || "DefaultFirstName"
            };
        });

        setSelectedOptions(updatedOptions);
    };

    const handleClose = async () => {
        setGroupChatWidget(false);
    }

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-card text-card-foreground border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600" />

                <button
                    type="button"
                    className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    onClick={handleClose}
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">Create a Group Chat</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Start a collaborative channel with 2 or more teammates.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Group Name
                        </label>
                        <input
                            type="text"
                            onChange={handleGroupNameChange}
                            value={groupName}
                            placeholder="e.g. Frontend Core Team"
                            className="w-full h-11 px-4 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Add Members
                        </label>

                        <ReactSelect
                            onChange={handleSelectChange}
                            value={selectedOptions}
                            isMulti
                            options={options}
                            components={{ Option: CustomOption }}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                }),
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: 'transparent',
                                    borderColor: state.isFocused ? 'var(--ring)' : 'var(--border)',
                                    borderRadius: '0.75rem',
                                    minHeight: '2.75rem',
                                    boxShadow: 'none',
                                }),
                                menu: (base) => ({
                                    ...base,
                                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                    color: isDark ? '#f8fafc' : '#0f172a',
                                    border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                                    borderRadius: '0.75rem',
                                    overflow: 'hidden',
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused
                                        ? isDark ? '#1e293b' : '#f1f5f9'
                                        : 'transparent',
                                    color: isDark ? '#f8fafc' : '#0f172a',
                                }),
                                multiValue: (base) => ({
                                    ...base,
                                    backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
                                    borderRadius: '0.5rem',
                                }),
                                multiValueLabel: (base) => ({
                                    ...base,
                                    color: isDark ? '#38bdf8' : '#0284c7',
                                    fontWeight: '600',
                                }),
                            }}
                            placeholder="Search and select teammates..."
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'pending'}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold text-sm shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {status === 'pending' ? 'Creating Group...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GroupChatWidget;
