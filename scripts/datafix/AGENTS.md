# Delete On Merge Lifecycle

To create a datafix script you will checkout a branch directly from main and make your changes there. The changes you make should only be for the script itself as nothing you write here will actually be persisted to the main branch. If you catch yourself wanting to make adjustments to some of the shared utilities, checkout a new branch, make the changes there, merge those changes into your branch. But honestly you shouldn't try to generalize the logic you are writing for the script. Each script is truly unique and shares very little in common with other scripts.

To actually run the datafix you will push the branch to the remote repository. From there you can utilize the workflow that runs datafixes and point the workflow to that branch.

The commits for the datafix branch will be used for historical purposes.

## Script Etiquette

- Do not dump the entire before/after into the console
- At the end, log out exactly what will happen as a result of this script so the user can understand it
- Use Zod schemas to ensure input and output types (never blindly assume)
