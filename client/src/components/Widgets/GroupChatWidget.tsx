import { useContext, useEffect, useState } from "react";
import ReactSelect from "react-select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { fetchPeople } from "../../api/auth";
import { createGroupConversation } from "../../api/conversation";
import { queryClient } from "../../api/auth";

const CustomOption = ({ label, data, innerProps }) => (
    <div {...innerProps} className="flex flex-row items-center space-x-3 my-2.5 ml-2 cursor-pointer">
        <img src={data.image} alt="" className="h-10 w-10 rounded-full object-contain" />
        <p className="text-base font-semibold">{label}</p>
    </div>
);

const GroupChatWidget = () => {

    const { setGroupChatWidget } = useContext(ThemeContext);
    const { user } = useContext(AuthContext)
    const [options, setOptions] = useState([]);
    const [groupName, setGroupName] = useState<string>("");
    const [selectedOptions, setSelectedOptions] = useState([]);

    const { data: people, isSuccess } = useQuery({
        queryKey: ['people'],
        queryFn: () => fetchPeople(user._id),
    });

    const { mutate, status } = useMutation({
        mutationFn: () => createGroupConversation(selectedOptions, groupName, user._id),
        onSuccess: async() => {
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            setGroupChatWidget(false);
            toast.success("New Group created");
        }
    });

    useEffect(() => {
        if (isSuccess) {
            const filterOptions = people.map((person) => ({
                label: person.fullName,
                value: person._id,
                image: person.picture,
                id: person._id,
            }));
            setOptions(filterOptions);
        }
    }, [isSuccess, people]);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (status === 'pending') return

        if (groupName.trim().length === 0) {
            toast.error('Enter a group name');
            return;
        } else if (selectedOptions.length < 2) {
            toast.error('Add at least 2 Members');
            return;
        }

        mutate();
    }

    const handleGroupNameChange = (event) => {
        setGroupName(event.target.value);
    };

    const handleSelectChange = (selectedOptions) => {
        const updatedOptions = selectedOptions.map(option => {
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

    return (
        <>
            <dialog id="my_modal_4" className="modal" open>
                <div className="modal-box w-11/12 h-2/3 md:w-3/5 md:h-3/5 lg:w-1/3 lg:h-3/5 max-w-5xl">
                    <h3 className="font-bold text-lg">Create a group chat</h3>
                    <p className="pt-2">Create a chat with more than 2 people.</p>

                    <div className="modal-action">
                        <form method="dialog" className="w-full" onSubmit={handleSubmit}>

                            <label className="label">
                                <span className="label-text font-bold">Group Name</span>
                            </label>
                            <input
                                type="text"
                                onChange={handleGroupNameChange}
                                value={groupName}
                                placeholder="Group name"
                                className="input input-bordered input-md w-full text-base"
                            />

                            <label className="label mt-4">
                                <span className="label-text font-bold">Members</span>
                            </label>

                            <ReactSelect
                                onChange={handleSelectChange}
                                value={selectedOptions}
                                isMulti
                                options={options}
                                components={{ Option: CustomOption }}
                                menuPortalTarget={document.body}
                                styles={{
                                    menuPortal: (base) => ({
                                        ...base,
                                        zIndex: 9999
                                    })
                                }}
                                classNames={{
                                    control: () => "text-base"
                                }}
                            />

                            <button type="submit" className="btn btn-info text-white absolute right-2 bottom-4">
                                {status === 'pending' ?
                                    <span className="loading loading-spinner"></span>
                                    :
                                    "Create"
                                }
                            </button>
                            <button className="btn btn-ghost absolute right-24 bottom-4" onClick={handleClose}>Cancel</button>
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={handleClose}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export default GroupChatWidget;