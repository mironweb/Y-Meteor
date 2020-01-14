/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/removeUserProfileLandingUrl.js')
 */

function initialize() {
    print('Removing user profile landingUrl property');

    const result = db.users.update(
        {},
        { $unset: { 'profile.landingUrl': true } },
        { upsert: false, multi: true }
    );

    print(result);
}
initialize();
