import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoWarningOutline } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";
import { deleteConversation } from "../../api/conversation";
import { toast } from "react-toastify";

const ChatDeleteModal = () => {

    const { id } = useParams()
    const navigate = useNavigate();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user: any = queryClient.getQueryData(['user']);

    const { setDeleteModal } = useContext(ThemeContext);

    const { mutate, status } = useMutation({
        mutationFn: () => deleteConversation(user._id, id),
        onSettled: async() => {
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success("Conversation Successfully deleted");
            handleDeleteModal();
            navigate("/");
        }
    });

    const handleDeleteConversation = () => {

        if (status === 'pending') return

        mutate();
    }

    const handleDeleteModal = () => {
        setDeleteModal(false);
    }

    return (
        <dialog id="my_modal_3" className="modal" open>
            <div className="modal-box w-[98%] max-w-xl">
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={handleDeleteModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </form>

                <div className="flex flex-col space-y-4 md:space-y-1.5">
                    <div className="flex flex-row space-x-1.5 md:space-x-3">

                        <div className="p-0.5">
                            <div className="p-2 rounded-full bg-red-200">
                                <IoWarningOutline className="h-7 w-7  text-red-600" />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-lg font-semibold">Delete Conversation</span>
                            <span className="text-gray-500 text-sm md:text-base">Are you sure you want to delete this conversation? This action cannot be undone.</span>
                        </div>
                    </div>

                    <div className="flex flex-row justify-end space-x-1.5 py-0.5 pr-0.5">
                        <button className="btn btn-ghost" onClick={handleDeleteModal}>Cancel</button>
                        <button type="submit" className="btn btn-error text-white" onClick={handleDeleteConversation}>
                            {status === 'pending' ?
                                <span className="loading loading-spinner"></span>
                                :
                                "Delete"
                            }
                        </button>
                    </div>

                </div>
            </div>
        </dialog>
    )
}

export default ChatDeleteModal;