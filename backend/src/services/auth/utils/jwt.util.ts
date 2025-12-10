import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export const signToken = (payload: object, expiresIn = '1h') => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
  return new Promise<any>((resolve, reject) => {
    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) return reject(err);
      return resolve(decoded);
    });
  });
};
