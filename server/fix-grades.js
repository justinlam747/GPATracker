const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpa-tracker');

// Import Course model
const Course = require('./models/Course');

async function fixCourseGrades() {
    try {
        console.log('🔍 Finding all courses...');

        // Get all courses
        const courses = await Course.find({});
        console.log(`📚 Found ${courses.length} courses`);

        let fixedCount = 0;

        for (const course of courses) {
            if (course.courseType === 'simple' && course.grade) {
                console.log(`\n📝 Processing: ${course.name} (${course.grade})`);
                console.log(`   Old gradePoints: ${course.gradePoints}`);

                // Use the same intelligent logic as the updated Course model
                let newGradePoints = 0;

                if (typeof course.grade === 'number') {
                    // Check if this is actually GPA points (not percentage)
                    if (course.gpaScale === '4.3' && course.grade <= 4.3 && course.grade > 0) {
                        // This is likely GPA points on 4.3 scale
                        newGradePoints = course.grade;
                    } else if (course.gpaScale === '4.0' && course.grade <= 4.0 && course.grade > 0) {
                        // This is likely GPA points on 4.0 scale
                        newGradePoints = course.grade;
                    } else {
                        // This is a percentage grade - convert to the course's scale
                        newGradePoints = course.calculateGradePointsFromPercentage(course.grade, course.gpaScale);
                    }
                } else if (typeof course.grade === 'string') {
                    // Check if this is a numeric string that could be GPA points
                    const numGrade = parseFloat(course.grade);
                    if (!isNaN(numGrade)) {
                        if (course.gpaScale === '4.3' && numGrade <= 4.3 && numGrade > 0) {
                            // This is likely GPA points on 4.3 scale
                            newGradePoints = numGrade;
                        } else if (course.gpaScale === '4.0' && numGrade <= 4.0 && numGrade > 0) {
                            // This is likely GPA points on 4.0 scale
                            newGradePoints = numGrade;
                        } else if (numGrade <= 100 && numGrade > 0) {
                            // This is a percentage grade - convert to the course's scale
                            newGradePoints = course.calculateGradePointsFromPercentage(numGrade, course.gpaScale);
                        } else {
                            // Letter grade - convert to the course's scale
                            newGradePoints = course.calculateGradePointsFromLetter(course.grade, course.gpaScale);
                        }
                    } else {
                        // Letter grade - convert to the course's scale
                        newGradePoints = course.calculateGradePointsFromLetter(course.grade, course.gpaScale);
                    }
                } else {
                    // Letter grade - convert to the course's scale
                    newGradePoints = course.calculateGradePointsFromLetter(course.grade, course.gpaScale);
                }

                course.gradePoints = newGradePoints;
                console.log(`   New gradePoints: ${course.gradePoints}`);

                // Save the course (this will trigger the updated pre-save hook)
                await course.save();
                fixedCount++;

                console.log(`   ✅ Fixed and saved`);
            }
        }

        console.log(`\n🎉 Successfully fixed ${fixedCount} courses!`);

        // Show summary
        const updatedCourses = await Course.find({});
        console.log('\n📊 Updated Course Summary:');
        updatedCourses.forEach(c => {
            console.log(`   ${c.name}: ${c.grade} → ${c.gradePoints} GPA points`);
        });

        // Calculate new overall GPA
        const totalPoints = updatedCourses.reduce((sum, c) => sum + (c.gradePoints || 0), 0);
        const totalCredits = updatedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
        const newGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

        console.log(`\n🎯 New Overall GPA: ${newGPA}`);

    } catch (error) {
        console.error('❌ Error fixing courses:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the fix
fixCourseGrades();
