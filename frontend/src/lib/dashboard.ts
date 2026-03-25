import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { vi } from "date-fns/locale";
import type { Post } from "@/types/post.types";
import type { Question } from "@/types/question.types";
import type { Transaction } from "@/types/wallet.types";

export type EarningsRange = 7 | 30;

export interface EarningsTrendPoint {
  date: string;
  label: string;
  amount: number;
}

function toDate(value: string) {
  return parseISO(value);
}

export function isAuthorRevenueTransaction(transaction: Transaction) {
  return (
    transaction.direction === "in" &&
    (transaction.type === "bonus" || transaction.type === "question_to_author")
  );
}

export function calculateThisMonthRevenue(transactions: Transaction[]) {
  const interval = {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  };

  return transactions.reduce((total, transaction) => {
    if (!isAuthorRevenueTransaction(transaction)) {
      return total;
    }

    const createdAt = toDate(transaction.createdAt);

    return isWithinInterval(createdAt, interval) ? total + transaction.amount : total;
  }, 0);
}

export function buildEarningsTrend(
  transactions: Transaction[],
  range: EarningsRange,
): EarningsTrendPoint[] {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, range - 1));
  const buckets = eachDayOfInterval({ start, end }).map((day) => {
    const key = format(day, "yyyy-MM-dd");

    return {
      date: key,
      label: format(day, range === 7 ? "EEE" : "dd/MM", { locale: vi }),
      amount: 0,
    };
  });

  const amountByDate = new Map(buckets.map((item) => [item.date, 0]));

  transactions.forEach((transaction) => {
    if (!isAuthorRevenueTransaction(transaction)) {
      return;
    }

    const createdAt = toDate(transaction.createdAt);

    if (!isWithinInterval(createdAt, { start, end })) {
      return;
    }

    const key = format(createdAt, "yyyy-MM-dd");
    amountByDate.set(key, (amountByDate.get(key) ?? 0) + transaction.amount);
  });

  return buckets.map((bucket) => ({
    ...bucket,
    amount: amountByDate.get(bucket.date) ?? 0,
  }));
}

export function rankTopPosts(posts: Post[]) {
  return [...posts]
    .sort((left, right) => {
      if (right.viewCount !== left.viewCount) {
        return right.viewCount - left.viewCount;
      }

      const rightTime = new Date(right.publishedAt ?? right.updatedAt).getTime();
      const leftTime = new Date(left.publishedAt ?? left.updatedAt).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 5);
}

export function attachQuestionPosts(questions: Question[], posts: Post[]) {
  const postsById = new Map(
    posts.map((post) => [
      post.id,
      {
        id: post.id,
        title: post.title,
        slug: post.slug,
      },
    ]),
  );

  return questions.map((question) => ({
    ...question,
    post: postsById.get(question.postId) ?? question.post,
  }));
}
