const normalizeMongoUri = (uri = '') => uri.trim().replace(/\/+$/, '');

const getCompetitionMongoUri = () =>
    process.env.MONGODB_COMPETITION_URI || process.env.MONGODB_URI || '';

const getDualityMongoUri = () =>
    process.env.MONGODB_DUALITY_URI || process.env.MONGODB_EXTENDED_URI || '';

const assertMongoSeparation = () => {
    const competitionUri = getCompetitionMongoUri();
    const dualityUri = getDualityMongoUri();

    if (!competitionUri) {
        throw new Error(
            'Competition DB URI missing. Set MONGODB_COMPETITION_URI (or legacy MONGODB_URI).'
        );
    }

    if (!dualityUri) {
        throw new Error(
            'Duality DB URI missing. Set MONGODB_DUALITY_URI (or legacy MONGODB_EXTENDED_URI).'
        );
    }

    const allowShared = String(process.env.ALLOW_SHARED_MONGODB || '').toLowerCase() === 'true';
    if (!allowShared && normalizeMongoUri(competitionUri) === normalizeMongoUri(dualityUri)) {
        throw new Error(
            'Competition and Duality Mongo URIs are identical. Use separate databases for isolation, or set ALLOW_SHARED_MONGODB=true to bypass.'
        );
    }
};

module.exports = {
    getCompetitionMongoUri,
    getDualityMongoUri,
    assertMongoSeparation,
};
