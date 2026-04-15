const COMPETITION_COLLECTIONS = [
    'admins',
    'questions',
    'rounds',
    'settings',
    'submissions',
    'teams',
];

const DUALITY_COLLECTIONS = [
    'dualityallowedemails',
    'dualitydrafts',
    'dualityquestions',
    'dualitysettings',
    'dualitysubmissions',
    'dualityusers',
    'quizzes',
    'quizsubmissions',
];

const toNameSet = (names) => new Set(names.map((n) => n.toLowerCase()));

const getCollectionNames = async (conn) => {
    const cols = await conn.db.listCollections({}, { nameOnly: true }).toArray();
    return cols.map((c) => c.name.toLowerCase());
};

const getBoundaryReport = async (competitionConn, dualityConn) => {
    const competitionNames = await getCollectionNames(competitionConn);
    const dualityNames = await getCollectionNames(dualityConn);

    const competitionSet = toNameSet(competitionNames);
    const dualitySet = toNameSet(dualityNames);
    const competitionExpected = toNameSet(COMPETITION_COLLECTIONS);
    const dualityExpected = toNameSet(DUALITY_COLLECTIONS);

    const misplacedInCompetition = [...dualityExpected].filter((name) =>
        competitionSet.has(name)
    );
    const misplacedInDuality = [...competitionExpected].filter((name) =>
        dualitySet.has(name)
    );

    return {
        competitionCollections: competitionNames,
        dualityCollections: dualityNames,
        misplacedInCompetition,
        misplacedInDuality,
        clean: misplacedInCompetition.length === 0 && misplacedInDuality.length === 0,
    };
};

const assertStrictCollectionBoundaries = async (competitionConn, dualityConn) => {
    const report = await getBoundaryReport(competitionConn, dualityConn);
    if (report.clean) return report;

    const problems = [];
    if (report.misplacedInCompetition.length) {
        problems.push(
            `Competition DB contains Duality collections: ${report.misplacedInCompetition.join(', ')}`
        );
    }
    if (report.misplacedInDuality.length) {
        problems.push(
            `Duality DB contains Competition collections: ${report.misplacedInDuality.join(', ')}`
        );
    }

    throw new Error(
        `Database boundary violation detected. ${problems.join(' | ')}`
    );
};

module.exports = {
    COMPETITION_COLLECTIONS,
    DUALITY_COLLECTIONS,
    getBoundaryReport,
    assertStrictCollectionBoundaries,
};
