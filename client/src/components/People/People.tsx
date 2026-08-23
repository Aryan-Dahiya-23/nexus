import { useQuery } from "@tanstack/react-query";
import Header from "../Header/Header";
import PeopleItems from "./PeopleItems";
import PeopleItemsLoading from "../UI/PeopleItemsLoading";
import { verify, fetchPeople } from "../../api/auth";
import { Participant, User } from "../../types";

const People = () => {

    const { data: user } = useQuery<User>({
        queryKey: ['user'],
        queryFn: () => verify(),
        staleTime: 10000,
    });

    const userId = user?._id;

    const { data, isLoading } = useQuery<Participant[]>({
        queryKey: ['people'],
        queryFn: () => fetchPeople(userId),
        staleTime: 10000,
        enabled: !!userId,
    });

    return (
        <div className="flex flex-col mb-16 md:mb-0 w-full md:w-[40%] lg:w-[25%] lg:pl-2 md:h-[100vh]">

            <Header message="People" />

            {isLoading && <PeopleItemsLoading />}

            <div className="flex flex-col space-y-1 py-2 custom-scrollbar" id="people">
                {data &&
                    data.map((person: Participant) => (
                        <PeopleItems
                            key={person._id}
                            userId={person._id}
                            username={person.fullName}
                            avatarSrc={person.picture}
                        />
                    ))}
            </div>

        </div>);
};

export default People;
