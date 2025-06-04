export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  createdAt: string;
}

export type UserInfoInterface = Pick<
  UserInfo,
  'id' | 'firstName' | 'lastName' | 'address' | 'createdAt'
>;
