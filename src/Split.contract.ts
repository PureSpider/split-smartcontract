interface TStorage {
    metadata: TBig_map<TString, TBytes>;
    admins: TSet<TAddress>;
    shares: TSet<TAddress>;
}

// const metadata = '{"name": "fund splitter","version": "1.0.0","homepage": "https://split.xtz.tools/","authors": ["PureSpider <https://purespider.de/>"],"interfaces": ["TZIP-016"]}';

@Contract
export class Split {
    constructor(public storage: TStorage) { }

    @EntryPoint
    default() {
        const elements: TList<TAddress> = this.storage.shares.elements();
        const size = elements.size();

        const div = Sp.ediv(Sp.amount, size).openSome();
        const perPerson: TMutez = div.fst();
        const rest: TMutez = div.snd();

        let restSent: boolean = false;

        for (const person of elements) {
            if (!restSent) {
                Sp.transfer(Sp.unit, perPerson + rest, Sp.contract<TUnit>(person).openSome());
                restSent = true;
            } else {
                Sp.transfer(Sp.unit, perPerson, Sp.contract<TUnit>(person).openSome());
            }
        }
    }

    // Admin stuff
    @Inline
    isAdmin = (address: TAddress): TBool => this.storage.admins.contains(address);

    @Inline
    onlyAdmin(): void {
        Sp.verify(this.isAdmin(Sp.sender), 'NOT_ADMIN');
    }

    @EntryPoint
    add_admin(admin: TAddress): void {
        this.onlyAdmin();

        Sp.verify(!this.storage.admins.contains(admin), 'ALREADY_ADDED');

        this.storage.admins.add(admin);
    }

    @EntryPoint
    remove_admin(admin: TAddress): void {
        this.onlyAdmin();

        Sp.verify(Sp.sender != admin, 'CANNOT_REMOVE_SELF');
        Sp.verify(this.storage.admins.contains(admin), 'NOT_ADDED');

        this.storage.admins.remove(admin);
    }

    @EntryPoint
    add_share(share: TAddress): void {
        this.onlyAdmin();

        this.storage.shares.add(share);
    }

    @EntryPoint
    remove_share(share: TAddress): void {
        this.onlyAdmin();

        this.storage.shares.remove(share);
    }
}

Dev.test({ name: 'Split' }, () => {
    Scenario.h1('Split');

    Scenario.tableOfContents();

    const tezos: TMutez = (1_000_000 as TMutez);

    const c1 = Scenario.originate(new Split({
        metadata: [
            ["", "0x74657a6f732d73746f726167653a6d65746164617461"],
            ["metadata", "0x7b226e616d65223a202266756e642073706c6974746572222c2276657273696f6e223a2022312e302e30222c22686f6d6570616765223a202268747470733a2f2f73706c69742e78747a2e746f6f6c732f222c22617574686f7273223a205b2250757265537069646572203c68747470733a2f2f707572657370696465722e64652f3e225d2c22696e7465726661636573223a205b22545a49502d303136225d7d"]
        ],
        admins: ['tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S'],
        shares: [],
    }));

    Scenario.show(c1.storage);

    Scenario.h2('Regular functionality');

    // --------------------------------------------------

    Scenario.h3('Add shares');

    const amount: TMutez = (100 as TNat).multiply(tezos);

    Scenario.transfer(c1.add_share("tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S"), {
        sender: "tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S",
    });

    Scenario.verify(c1.storage.shares.contains("tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S"));

    // --------------------------------------------------

    Scenario.transfer(c1.add_share("tz1QWFRpbN4rA8vABvxPAREtuffu6F1VKFTB"), {
        sender: "tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S",
    });

    Scenario.verify(c1.storage.shares.contains("tz1QWFRpbN4rA8vABvxPAREtuffu6F1VKFTB"));

    // --------------------------------------------------

    Scenario.transfer(c1.add_share("tz1i5uekB9LeMyJFZKbMD4PkKwSJHpcXVrBJ"), {
        sender: "tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S",
    });

    Scenario.verify(c1.storage.shares.contains("tz1i5uekB9LeMyJFZKbMD4PkKwSJHpcXVrBJ"));

    // --------------------------------------------------

    Scenario.transfer(c1.default(), {
        sender: "tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S",
        amount: amount
    });

    Scenario.verify(c1.balance == 0 as TMutez);
});

Dev.compileContract('full', new Split({
    metadata: [
        ["", "0x74657a6f732d73746f726167653a6d65746164617461"],
        ["metadata", "0x7b226e616d65223a202266756e642073706c6974746572222c2276657273696f6e223a2022312e302e30222c22686f6d6570616765223a202268747470733a2f2f73706c69742e78747a2e746f6f6c732f222c22617574686f7273223a205b2250757265537069646572203c68747470733a2f2f707572657370696465722e64652f3e225d2c22696e7465726661636573223a205b22545a49502d303136225d7d"]
    ],
    admins: ['tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S'],
    shares: [],
}));
