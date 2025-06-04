export interface UserInterface {

    username: string;
    password: string;
    firstName: string;
    lastName: string;
    address: string;
}

export type LoginInterface = Pick<UserInterface, "username" | "password">
