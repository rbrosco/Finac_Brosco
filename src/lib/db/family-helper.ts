import { getDataSource } from "@/lib/db/data-source";
import { Family } from "@/lib/db/entities/Family";
import { FamilyMember, FamilyMemberStatus } from "@/lib/db/entities/FamilyMember";

export interface FamilyContextInfo {
  family: Family | null;
  members: FamilyMember[];
  userRole: "ADMIN" | "MEMBER" | "VIEWER" | null;
  userIds: string[];
}

/**
 * Returns all user IDs that belong to the same active family as the given userId.
 * If the user is not in a family, returns [userId].
 */
export async function getFamilyUserIds(userId: string): Promise<string[]> {
  try {
    const dataSource = await getDataSource();
    const familyMemberRepo = dataSource.getRepository(FamilyMember);
    const familyRepo = dataSource.getRepository(Family);

    // Check if user is a member of any family
    const membership = await familyMemberRepo.findOne({
      where: { user_id: userId, status: FamilyMemberStatus.ACCEPTED }
    });

    let familyId: string | null = membership ? membership.family_id : null;

    if (!familyId) {
      // Check if user owns a family
      const ownedFamily = await familyRepo.findOne({ where: { owner_id: userId } });
      if (ownedFamily) {
        familyId = ownedFamily.id;
      }
    }

    if (!familyId) {
      return [userId];
    }

    // Find all accepted members of this family
    const allMemberships = await familyMemberRepo.find({
      where: { family_id: familyId, status: FamilyMemberStatus.ACCEPTED }
    });

    const ownedFamily = await familyRepo.findOne({ where: { id: familyId } });

    const ids = new Set<string>();
    if (ownedFamily) ids.add(ownedFamily.owner_id);
    allMemberships.forEach((m) => ids.add(m.user_id));

    return Array.from(ids);
  } catch (error) {
    console.error("Error in getFamilyUserIds:", error);
    return [userId];
  }
}

/**
 * Returns full family context information for a user.
 */
export async function getFamilyContext(userId: string): Promise<FamilyContextInfo> {
  try {
    const dataSource = await getDataSource();
    const familyRepo = dataSource.getRepository(Family);
    const familyMemberRepo = dataSource.getRepository(FamilyMember);

    // Find owned family or membership
    let family = await familyRepo.findOne({ where: { owner_id: userId } });
    let membership: FamilyMember | null = null;

    if (!family) {
      membership = await familyMemberRepo.findOne({
        where: { user_id: userId, status: FamilyMemberStatus.ACCEPTED },
        relations: ["family"]
      });
      if (membership && membership.family) {
        family = membership.family;
      }
    } else {
      membership = await familyMemberRepo.findOne({
        where: { family_id: family.id, user_id: userId }
      });
    }

    if (!family) {
      return { family: null, members: [], userRole: null, userIds: [userId] };
    }

    const members = await familyMemberRepo.find({
      where: { family_id: family.id },
      relations: ["user"]
    });

    const userRole = family.owner_id === userId ? "ADMIN" : membership?.role || "MEMBER";

    const userIds = new Set<string>();
    userIds.add(family.owner_id);
    members.filter(m => m.status === FamilyMemberStatus.ACCEPTED).forEach(m => userIds.add(m.user_id));

    return {
      family,
      members,
      userRole,
      userIds: Array.from(userIds)
    };
  } catch (error) {
    console.error("Error in getFamilyContext:", error);
    return { family: null, members: [], userRole: null, userIds: [userId] };
  }
}
