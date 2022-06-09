interface TStorage {
    metadata: TBig_map<TString, TBytes>;
    admins: TSet<TAddress>;
    shares: TSet<TAddress>;
}

// const metadata = '{\"name\": \"token offers\",\"version\": \"1.0.0\",\"homepage\": \"https://offers.xtz.tools/\",\"authors\": [\"PureSpider <https://purespider.de/>\"],\"interfaces\": [\"TZIP-016\"]}';

@Contract
export class Split {
    storage: TStorage = {
        metadata: [
            ["", Sp.pack('tezos-storage:metadata')],
            ["metadata", "0x00"]
        ],
        admins: ['tz1PqooZUtCQqP539PmMzUWHtaUX6EQtFY5S'],
        shares: [],
    };

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

    const c1 = Scenario.originate(new Split());

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

Dev.compileContract('full', new Split());
