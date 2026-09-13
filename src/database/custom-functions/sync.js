async function sync({
  tx,
  model,
  ownerField,
  ownerId,
  relatedField,
  relatedIds,
}) {
  const uniqueIds = [...new Set(relatedIds)];

  await tx[model].deleteMany({
    where: {
      [ownerField]: ownerId,
      ...(uniqueIds.length > 0 && {
        [relatedField]: { notIn: uniqueIds },
      }),
    },
  });

  for (const relatedId of uniqueIds) {
    await tx[model].upsert({
      where: {
        [`${ownerField}_${relatedField}`]: {
          [ownerField]: ownerId,
          [relatedField]: relatedId,
        },
      },

      update: {},

      create: {
        [ownerField]: ownerId,
        [relatedField]: relatedId,
      },
    });
  }
}

export { sync };
