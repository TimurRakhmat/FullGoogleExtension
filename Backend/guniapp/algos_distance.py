# -*- coding: utf-8 -*-
import json


def get_costs_value(costs, s1, s2, key):
    return costs[key].get(s1+s2, 1)


def damerau_levenshtein_distance(s1, s2, costs):
    d = {}

    insert_cost = costs.get("insert", 1)
    remove_cost = costs.get("remove", 1)
    transpose_cost = costs.get("transpose", 1)

    lenstr1 = len(s1)
    lenstr2 = len(s2)
    d[(-1, -1)] = 0
    for i in range(-1, lenstr1 + 1):
        d[(i, -1)] = i + 1
    for j in range(-1, lenstr2 + 1):
        d[(-1, j)] = j + 1

    for i in range(lenstr1):
        for j in range(lenstr2):
            if s1[i] == s2[j]:
                cost = 0
            else:
                cost = get_costs_value(costs, s1[i], s2[j], "replace")
            d[(i, j)] = min(
                d[(i - 1, j)] + remove_cost,
                d[(i, j - 1)] + insert_cost,
                d[(i - 1, j - 1)] + cost,
            )
            if i and j and s1[i] == s2[j - 1] and s1[i - 1] == s2[j]:
                d[(i, j)] = min(d[(i, j)], d[i - 2, j - 2] + transpose_cost)

    # print(" \t \t", end="")
    # for j in range(lenstr2):
    #     print(s2[j]+"\t", end="")
    # print()
    #
    # print(" \t0\t", end="")
    # for j in range(lenstr2):
    #     print(str(d[(-1, j)]) + "\t", end="")
    # print()
    #
    # for i in range(lenstr1):
    #     print(s1[i]+'\t'+str(d[(i, -1)])+"\t", end="")
    #     for j in range(lenstr2):
    #         print(str(d[(i, j)])+"\t", end="")
    #     print()

    return d[lenstr1 - 1, lenstr2 - 1]


if __name__ == '__main__':
    with open('total_costs.json', encoding='utf-8') as f:
        templates = json.load(f)

    cost_result = damerau_levenshtein_distance("капкна","таракан", templates)
    print(cost_result)
