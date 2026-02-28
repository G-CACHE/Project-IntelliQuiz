@org.springframework.modulith.ApplicationModule(
    allowedDependencies = {"shared", "team", "team :: events", "submission", "submission :: events"}
)
package com.intelliquiz.api.scoreboard;
