import data from "../../applications/cdk-outputs-cloudximage.json" assert { type: "json" };
import serverlessOutputJson from "../../applications/cdk-outputs-cloudxserverless.json" assert { type: "json" };

const cloudxImageOutput = data.cloudximage;
const serverLessOutput = serverlessOutputJson.cloudxserverless;

export const getAppInstanceProperty = (propertyValue) => {
    const key = Object.keys(cloudxImageOutput).find((key) =>
        key.startsWith(propertyValue)
    );
    return key ? cloudxImageOutput[key] : undefined;
};

export const getAppInstancePropertyForServerless = (propertyValue) => {
    const key = Object.keys(serverLessOutput).find((key) =>
        key.startsWith(propertyValue)
    );
    return key ? serverLessOutput[key] : undefined;
}; 