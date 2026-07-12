# Commands

* One directory per command, under server/commands/<kebab-case-name>
* Two files per command:
    * I<Name>Command.ts — defines the command payload and the command interface
    * <Source><Name>Command.ts — the implementation, prefixed by its backing data source (Blob, Prisma)
* If a command composes more than one repository or service (no single backing source), the implementation is unprefixed: <Name>Command.ts
* There is exactly one implementation per command, ever — migrating to a new data source means replacing this file, not adding a second one alongside it
* A command may call a service when it needs domain logic shared with another command or query; otherwise it may call a repository directly
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
