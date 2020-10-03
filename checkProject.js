#!/usr/bin/node

const request = require("request");

if (process.argv.length !== 6) {
  console.log("Usage: ./checkProject.js apiKey email password project");
  process.exit();
}

const apiKey = process.argv[2];
const userEmail = process.argv[3];
const userPassword = process.argv[4];
const projectId = process.argv[5];

let myToken;

request.post(
  {
    url: "https://intranet.hbtn.io/users/auth_token.json",
    headers: {
      "Content-Type": "application/json",
    },
    qs: {
      api_key: apiKey,
      email: userEmail,
      password: userPassword,
      scope: "checker",
    },
  },
  function (error, response, body) {
    if (error) {
      console.log("ERROR With Auth Token Request");
      process.exit();
    } else {
      if (response.statusCode !== 200) {
        console.log("Check your email and password. Something was wrong");
        console.log("Usage: ./checkProject.js apiKey email password project");
        process.exit();
      }
      myToken = JSON.parse(body).auth_token;
    }
    request.get(
      {
        url: `https://intranet.hbtn.io/projects/${projectId}.json`,
        headers: {
          "Content-Type": "application/json",
        },
        qs: {
          auth_token: myToken,
        },
      },
      async function (error, response, body) {
        if (error) {
          console.log("ERROR With Project id Request");
          process.exit();
        } else {
          if (response.statusCode !== 200) {
            console.log("Check the project id. Something was wrong");
            console.log(
              "Usage: ./checkProject.js apiKey email password project"
            );
            process.exit();
          }
          const projectInfo = JSON.parse(body);
          console.log(` ------ PROJECT: ${projectInfo.name}  -------`);
          let tasks = projectInfo.tasks;
          for (task of tasks) {
            if (task.checker_available === true) {
              task.checkid = requestCheck(task, myToken);
            }
          }
          for (task of tasks) {
            if (task.checker_available == true) {
              const idResp = await task.checkid;
              task.checkid = idResp.id;
            }
          }
          for (task of tasks) {
            if (task.checker_available == true) {
              console.log(`----> Task ${task.position - 1}`);
              let checkedFlag = false;
              while (checkedFlag === false) {
                sleep(100);
                resultTask = await requestResult(task, myToken);
                if (resultTask.status !== "Sent") {
                  checkedFlag = true;
                }
              }

              for (check of resultTask.result_display.checks) {
                if (check.passed === true) console.log(`${check.title}: Green`);
                else {
                  console.log(`${check.title}: Red`);
                }
              }
            } else {
              console.log(`----> Task ${task.position - 1}`);
              console.log("Manual Review");
            }
          }
        }
      }
    );
  }
);

function requestResult(task, myToken) {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: `https://intranet.hbtn.io/correction_requests/${task.checkid}.json`,
        headers: { "Content-Type": "application/json" },
        qs: {
          auth_token: myToken,
        },
      },
      function (error, response, body) {
        if (error) {
          console.log("ERROR With request of results");
          process.exit();
        } else {
          if (response.statusCode !== 200) {
            console.log(
              "Something went wrong asking for the results of the correction"
            );
            process.exit();
          }
          resolve(JSON.parse(body));
        }
      }
    );
  });
}

function requestCheck(task, myToken) {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: `https://intranet.hbtn.io/tasks/${task.id}/start_correction.json`,
        headers: { "Content-Type": "application/json" },
        qs: { auth_token: myToken },
      },
      function (error, response, body) {
        if (error) {
          console.log("ERROR With Request of corrections");
          process.exit();
        } else {
          if (response.statusCode !== 200) {
            console.log(
              "Something went wrong asking for the correction of the task"
            );
            process.exit();
          }
          resolve(JSON.parse(body));
        }
      }
    );
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
