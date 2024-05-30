from fastapi import FastAPI, Body
from starlette.responses import JSONResponse
from algos_distance import damerau_levenshtein_distance
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open('total_costs.json', encoding='utf-8') as f:
        templates = json.load(f)


@app.post("/find")
async def find_req(data=Body()):
    # print(data)
    # my_json = data.decode('utf8')
    # data = json.loads(my_json)
    # print(data)
    req_str = data["find_str"]
    req_params = data["find_arr"]

    

    response_params = []
    dam_len = len(req_str) // 8 + 1
    for req in req_params:
        c_len = damerau_levenshtein_distance(req_str, req, templates)
        if c_len <= dam_len:
            response_params.append(req)

    return JSONResponse({"find_str": req_str, "ans_find": response_params})
