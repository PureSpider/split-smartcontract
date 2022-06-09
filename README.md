# Information

### Running compilations

The command below will iterate over all files in the `src` directory with postfix `*.contract.ts` and run all compilation targets.

```shell
npm run compile
```

### Running tests

The command below will iterate over all files in the `src` directory with postfix `*.contract.ts` and run all test targets.

```shell
npm run test
```

### Deploy contracts

By default, the originator will use a faucet account.
But you can provide your own private key by providing the argument `--private-key`

```shell
npm run originate -- --code build/compilation/<...>_contract.tz --storage build/compilation/<...>_storage.tz --rpc https://mainnet.smartpy.io --private-key <edsk...>
```
