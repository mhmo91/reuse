import { BehaviorSubject } from "rxjs";

type UserFilter = {
  search: string | undefined;
};

export const $usersFilter = new BehaviorSubject<UserFilter>(
  localStorage.getItem("usersFilter")
    ? JSON.parse(localStorage.getItem("usersFilter")!)
    : {
        search: "",
      }
);
