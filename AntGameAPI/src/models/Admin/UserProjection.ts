export class UserProjections {
  public static UsersList = { username: 1, banned: 1, registrationData: 1 };
  public static RecentlyLoggedIn = { username: 1, loginRecord: { $first: "$loginRecords" } }
}
