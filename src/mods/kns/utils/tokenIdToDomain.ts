export default function tokenIdToDomain(tokenId: string): string {
    return Buffer.from(
      Buffer.from(tokenId, 'hex').toString('utf8'),
      'hex',
    ).toString('utf8');
}