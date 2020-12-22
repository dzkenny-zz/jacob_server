export const saveSession = (session: any) => {
    return new Promise((resolve, reject) => {
        session.save((err: any) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            console.log(session);
            resolve(session);
        })
    })
}