# Commands

* One directory per command, under server/commands/<kebab-case-name>
* Two files per command:
    * I<Name>Command.ts — defines the command payload and the command interface
    * <Source><Name>Command.ts — the implementation, prefixed by its backing data source (Blob, Prisma)
* The implementation is unprefixed when it touches more than one repository — a single-repository command stays prefixed by that repository's source (Blob, Prisma) even if it also calls a service function.
* There is exactly one implementation per command, ever — migrating to a new data source means replacing this file, not adding a second one alongside it
* A command always loads what it needs via repositories and persists the result via repositories — that never changes. When logic spans multiple entities and is reused by another command or query, the command calls a service function with the entities it already loaded; otherwise it just calls entity methods directly.
* Whatever calls the command imports the implementation class directly — no central registry
* A command is not a service — a command is one specific use case, a service is domain logic reused across use cases

Example: server/commands/update-user-name/

IUpdateUserNameCommand.ts
```ts
export type UpdateUserNamePayload = {
  userId: string;
  name: string;
};

export interface IUpdateUserNameCommand {
  execute(payload: UpdateUserNamePayload): Promise<void>;
}
```

PrismaUpdateUserNameCommand.ts
```ts
export class PrismaUpdateUserNameCommand implements IUpdateUserNameCommand {
  constructor(private users: IUserRepository) {}

  async execute(payload: UpdateUserNamePayload): Promise<void> {
    // implementation using this.users
  }
}
```
